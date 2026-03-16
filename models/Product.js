const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  size: { type: String, required: true },
  category: { type: String, default: 'Plates' },
  costPrice: { type: Number, default: 0 },
  sellPrice: { type: Number, default: 0 },
  margin: { type: String },
  stock: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
