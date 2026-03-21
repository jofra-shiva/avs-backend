const mongoose = require('mongoose');

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
}, { timestamps: true });

// Auto-generate empId if not provided
employeeSchema.pre('save', function(next) {
  if (!this.empId) {
    this.empId = 'EMP-' + Math.floor(100000 + Math.random() * 900000);
  }
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);
