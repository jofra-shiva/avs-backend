const mongoose = require('mongoose');

const employeeSchema = mongoose.Schema({
  empId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  department: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  joinDate: { type: Date },
  dob: { type: String },
  aadhar: { type: String },
  pan: { type: String },
  address: { type: String },
  salary: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);
