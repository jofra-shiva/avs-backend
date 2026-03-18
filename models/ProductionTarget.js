const mongoose = require('mongoose');

const productionTargetSchema = mongoose.Schema({
  productName: { type: String, required: true },
  sku: { type: String, required: true },
  productSize: { type: String, required: true },
  targetQty: { type: Number, required: true },
  producedQty: { type: Number, default: 0 },
  remainingQty: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
  unit: { type: String, default: 'Pieces' },
  size: { type: String },
  operator: { type: String, default: 'Rajesh' },
  date: { type: String, required: true }, // Store as YYYY-MM-DD
}, { timestamps: true });

// Add indexes for faster fetching
productionTargetSchema.index({ productSize: 1 });
productionTargetSchema.index({ date: -1 });

module.exports = mongoose.model('ProductionTarget', productionTargetSchema);
