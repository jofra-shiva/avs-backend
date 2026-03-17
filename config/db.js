const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is not defined in environment variables');
      return;
    }
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      family: 4
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Do not process.exit(1) in serverless environments to allow the app to stay alive
  }
};

module.exports = connectDB;
