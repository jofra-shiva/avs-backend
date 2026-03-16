const mongoose = require('mongoose');

const expenseSchema = mongoose.Schema({
  category: { type: String, required: true },
  description: { type: String },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  paymentMode: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
