const mongoose = require('mongoose');

const clientSchema = mongoose.Schema({
  clientType: { type: String, enum: ['Company', 'Personal'], default: 'Company' },
  companyName: { type: String }, // Made optional to support Individual/Personal clients
  contactPerson: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  status: { type: String, default: 'Active' },
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: String },
  lastOrder: { type: String }, // Changed to String to support "Never" and custom formats
  address: { type: String },
  gst: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);
