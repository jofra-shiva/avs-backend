require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');

const clearData = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.log('MONGO_URI is missing');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected.');
    const result = await Attendance.deleteMany({});
    console.log(`All attendance data cleared successfully! Deleted count: ${result.deletedCount}`);
    process.exit(0);
  } catch (error) {
    console.error('Error clearing data:', error);
    process.exit(1);
  }
};

clearData();
