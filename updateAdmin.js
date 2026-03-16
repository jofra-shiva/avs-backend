const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const updateAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { family: 4 });
    console.log('Connected to MongoDB...');

    const email = 'admin@avseco.in';
    const password = '12345678';
    const name = 'Admin User';

    let user = await User.findOne({ email });

    if (user) {
      user.password = password;
      user.role = 'admin';
      await user.save();
      console.log('Admin user updated successfully');
    } else {
      user = await User.create({
        name,
        email,
        password,
        role: 'admin'
      });
      console.log('Admin user created successfully');
    }

    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

updateAdmin();
