const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

/**
 * Seed Admin User
 * Run this with: node seedAdmin.js
 */
const seedAdmin = async () => {
  try {
    // Connect to Database with faster selection
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI, {
      family: 4,
      serverSelectionTimeoutMS: 5000
    });

    const adminEmail = 'admin@avseco.in'.toLowerCase();
    const adminPassword = '12345678';

    console.log(`Checking for admin user: ${adminEmail}...`);

    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      console.log('Admin user already exists. Resetting password and role...');
      admin.password = adminPassword;
      admin.role = 'admin';
      await admin.save();
      console.log('✅ Admin credentials updated successfully!');
    } else {
      console.log('Creating new admin user...');
      admin = await User.create({
        name: 'Admin User',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
      });
      console.log('✅ Admin user created successfully!');
    }

    console.log('---------------------------------');
    console.log('Access credentials for: ', adminEmail);
    console.log('Password: ', adminPassword);
    console.log('---------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ SEEDING ERROR:', error.message);
    process.exit(1);
  }
};

seedAdmin();
