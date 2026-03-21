const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Employee = require('../models/Employee');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const migrate = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27010/avseco');
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    const employees = await Employee.find({});
    console.log(`Found ${employees.length} employees to migrate.`);

    const VALID_MODULES = [
      "dashboard", "stock", "products", "production", 
      "employees", "attendance", "clients", "sales", "reports"
    ];

    for (let employee of employees) {
      let updated = false;

      // Ensure modules array exists
      if (!employee.modules) {
        employee.modules = [];
        updated = true;
      }

      // If admin, assign all modules
      if (employee.role === 'admin' && employee.modules.length !== VALID_MODULES.length) {
        employee.modules = VALID_MODULES;
        updated = true;
      }

      // Ensure username exists (use empId as fallback if missing)
      if (!employee.username) {
        employee.username = employee.empId || `user_${employee._id.toString().slice(-4)}`;
        updated = true;
      }

      if (updated) {
        // We use save() to trigger the pre-save hook for password/empId if needed, 
        // though here we only care about the new fields.
        await employee.save();
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
