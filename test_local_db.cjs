const mongoose = require('mongoose');

const testLocal = async () => {
  try {
    const uri = 'mongodb://localhost:27017/avseco';
    console.log('Testing connection to local MongoDB:', uri);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('SUCCESS: Connected to local MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('FAILURE: Could not connect to local MongoDB');
    console.error('Error:', err.message);
    process.exit(1);
  }
};

testLocal();
