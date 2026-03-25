const mongoose = require('mongoose');

const clientSchema = mongoose.Schema({
  clientType: { type: String, enum: ['Company', 'Personal'], default: 'Company' },
  companyName: { type: String }, // Optional for Personal
  contactPerson: { type: String, required: true },
  email: { type: String },
  phone: { type: String, required: true },
  status: { type: String, default: 'Active' },
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: String },
  lastOrder: { type: Date },
  address: { type: String, required: true },
  gst: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);
