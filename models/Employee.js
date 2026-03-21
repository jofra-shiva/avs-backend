const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const employeeSchema = mongoose.Schema({
  name: { type: String, required: true },
  department: { type: String, required: true },
  email: { type: String },
  phone: { type: String, unique: true },
  empId: { type: String, unique: true }, // Added to resolve E11000 duplicate null key error
  joinDate: { type: Date },
  dob: { type: String },
  aadhar: { type: String, unique: true },
  pan: { type: String },
  address: { type: String },
  salary: { type: Number },
  avatar: { type: String },
  username: { type: String, unique: true, sparse: true },
  password: { type: String },
  role: { type: String, default: 'employee' },
  modules: { type: [String], default: [] },
  isFirstLogin: { type: Boolean, default: true },
}, { timestamps: true });

// Match user entered password to hashed password in database
employeeSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt and auto-generate empId
employeeSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  if (!this.empId) {
    this.empId = 'EMP-' + Math.floor(100000 + Math.random() * 900000);
  }
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);
