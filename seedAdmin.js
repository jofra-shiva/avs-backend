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
    // Connect to Database
    await connectDB();

    const adminEmail = 'admin@avseco.in';
    const adminPassword = '12345678';

    console.log(`Checking for admin user: ${adminEmail}...`);

    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      console.log('Admin user already exists. Updating password...');
      admin.password = adminPassword;
      admin.role = 'admin';
      await admin.save();
      console.log('Admin status and password updated successfully!');
    } else {
      console.log('Creating new admin user...');
      admin = await User.create({
        name: 'Admin User',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
      });
      console.log('Admin user created successfully!');
    }

    console.log('---------------------------------');
    console.log('Email: ', adminEmail);
    console.log('Password: ', adminPassword);
    console.log('Role: ', admin.role);
    console.log('---------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\nTIP: This error usually means your IP address is not whitelisted in MongoDB Atlas or your network is blocking DNS SRV lookups.');
      console.error('Try adding 0.0.0.0/0 to your MongoDB Atlas Network Access whitelist to test.');
    }
    process.exit(1);
  }
};

seedAdmin();
