const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // 10s timeout
      socketTimeoutMS: 45000,
      family: 4 // Force IPv4
    };

    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is not defined in environment variables');
      return null;
    }

    console.log('Connecting to MongoDB...');
    cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongoose) => {
      console.log('MongoDB Connected successfully');
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error(`MongoDB Connection Error: ${error.message}`);
    return null;
  }
};

module.exports = connectDB;
