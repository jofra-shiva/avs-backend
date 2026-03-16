const mongoose = require('mongoose');

const productionSchema = mongoose.Schema({
  date: { type: String, required: true },
  time: { type: String },
  product: { type: String, default: 'Areca Leaf Plate' },
  size: { type: String, required: true },
  quantity: { type: Number, required: true },
  grade: { type: String, default: 'A' },
  operator: { type: String },
  status: { type: String, default: 'completed' },
}, { timestamps: true });

module.exports = mongoose.model('Production', productionSchema);
