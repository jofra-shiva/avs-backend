const mongoose = require('mongoose');
const Employee = require('./models/Employee');
const dotenv = require('dotenv');
dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const adminEmail = 'admin@avseco.in';
    const adminPassword = 'ceo@avseco';

    let admin = await Employee.findOne({ email: adminEmail });
    if (admin) {
      console.log('Admin already exists. Updating...');
      admin.password = adminPassword;
      admin.role = 'admin';
      admin.modules = ["dashboard", "stock", "products", "production", "employees", "attendance", "clients", "sales", "reports"];
      await admin.save();
      console.log('Admin updated');
    } else {
      console.log('Admin NOT found. Creating...');
      await Employee.create({
        name: 'Administrator',
        email: adminEmail,
        username: adminEmail,
        password: adminPassword,
        role: 'admin',
        department: 'Management',
        modules: ["dashboard", "stock", "products", "production", "employees", "attendance", "clients", "sales", "reports"]
      });
      console.log('Admin created');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createAdmin();
