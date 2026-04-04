const mongoose = require('mongoose');

const saleItemSchema = mongoose.Schema({
  productName: { type: String, required: true },
  baseName: { type: String },
  size: { type: String, required: true },
  qty: { type: Number, required: true },
  amount: { type: Number, required: true },
  unit: { type: String, default: 'pcs' },
  hsn: { type: String }
});

const saleSchema = mongoose.Schema({
  invoiceNo: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  customer: { type: String, required: true },
  company: { type: String },
  customerEmail: { type: String },
  customerPhone: { type: String },
  customerGstin: { type: String },
  customerAddress: { type: String },
  totalAmount: { type: Number, required: true },
  paidStatus: { type: String, enum: ['Paid', 'Unpaid', 'Partial'], default: 'Paid' },
  paymentMode: { type: String, default: 'Cash' },
  amountPaid: { type: Number, default: 0 },
  deliveryMode: { type: String, default: 'Door Delivery' },
  deliveredBy: { type: String },
  soldBy: { type: String },
  saleItems: [saleItemSchema],
  status: { type: String, default: 'success' },
  recordedBy: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
