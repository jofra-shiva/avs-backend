const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Employee = require('../models/Employee');
const User = require('../models/User'); // Import User model for password migration

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const migrate = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    const employees = await Employee.find({});
    console.log(`Found ${employees.length} employees to check.`);

    const VALID_MODULES = [
      "dashboard", "stock", "products", "production", 
      "employees", "attendance", "clients", "sales", "reports"
    ];

    for (let employee of employees) {
      let updated = false;

      // 1. Ensure modules array exists
      if (!employee.modules || !Array.isArray(employee.modules)) {
        employee.modules = [];
        updated = true;
      }

      // 2. Look for matching user in the old User collection to sync password/role
      if (employee.email) {
        const matchingUser = await User.findOne({ email: employee.email });
        if (matchingUser) {
          // Sync password if employee doesn't have one
          if (!employee.password) {
            employee.password = matchingUser.password; // Copy already hashed password
            updated = true;
          }
          // Sync role if user was admin
          if (matchingUser.role === 'admin' && employee.role !== 'admin') {
            employee.role = 'admin';
            updated = true;
          }
        }
      }

      // 3. If admin, assign all modules
      if (employee.role === 'admin' && employee.modules.length !== VALID_MODULES.length) {
        employee.modules = VALID_MODULES;
        updated = true;
      }

      // 4. Ensure username exists (fallback to email prefix or name prefix if missing)
      if (!employee.username) {
        if (employee.email) {
          employee.username = employee.email; // Use email as default username for compatibility
        } else {
          employee.username = employee.empId || `user_${employee._id.toString().slice(-4)}`;
        }
        updated = true;
      }

      if (updated) {
        // We use save() but note that pre-save hook for password hashing should ONLY 
        // hash if it's new/modified plaintext. Since we copy hashed password, 
        // we should be careful. 
        // In Employee.js pre-save: if (this.isModified('password') && this.password)
        // If we assign a HASHED password, isModified('password') is true.
        // It will RE-HASH! This is bad.
        
        // FIX: Update directly if password was copied to avoid re-hashing
        await Employee.updateOne({ _id: employee._id }, { 
            role: employee.role,
            modules: employee.modules,
            username: employee.username,
            password: employee.password,
            empId: employee.empId
        });
        
        console.log(`Migrated employee: ${employee.name} (${employee.username})`);
      }
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error(`Migration failed: ${error.message}`);
    process.exit(1);
  }
};

migrate();
