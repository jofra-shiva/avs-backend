const mongoose = require('mongoose');

const clientSchema = mongoose.Schema({
  companyName: { type: String, required: true },
  contactPerson: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  status: { type: String, default: 'Active' },
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: String },
  lastOrder: { type: Date },
  address: { type: String },
  gst: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);
