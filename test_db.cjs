const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const testConnection = async () => {
  try {
    const uri = process.env.MONGO_URI;
    console.log('Testing connection to:', uri.split('@')[1]); // Hide credentials
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000
    });
    console.log('SUCCESS: Connected to MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('FAILURE: Could not connect to MongoDB');
    console.error('Error Code:', err.code);
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    if (err.reason) console.error('Error Reason:', JSON.stringify(err.reason, null, 2));
    process.exit(1);
  }
};

testConnection();
