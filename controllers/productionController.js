const Production = require('../models/Production');

// @desc    Get all production records
// @route   GET /api/production
// @access  Private
const getProduction = async (req, res) => {
  try {
    const records = await Production.find({}).sort({ date: -1, createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Import ProductionTarget model
const ProductionTarget = require('../models/ProductionTarget');

// Helper to update target progress
const updateTargetProgress = async (date, productSize, qtyChange, operator, productName) => {
  try {
    const normalizedOperator = (operator || "").trim();
    const normalizedProduct = (productName || "").trim();
    const normalizedSize = (productSize || "").toLowerCase().trim();

    // 1. Try to find matching target by date, product, size AND operator (Case Insensitive)
    let target = await ProductionTarget.findOne({ 
      date: date.trim(),
      productName: { $regex: new RegExp("^" + normalizedProduct + "$", "i") },
      productSize: { $regex: new RegExp("^" + normalizedSize + "$", "i") },
      operator: { $regex: new RegExp("^" + normalizedOperator + "$", "i") }
    });

    // 2. Fallback: Try to find target by date, product and size (regardless of operator, Case Insensitive)
    if (!target) {
      target = await ProductionTarget.findOne({
        date: date.trim(),
        productName: { $regex: new RegExp("^" + normalizedProduct + "$", "i") },
        productSize: { $regex: new RegExp("^" + normalizedSize + "$", "i") }
      });
    }

    if (target) {
      console.log(`[TARGET MATCHED] Updating ${normalizedProduct} ${normalizedSize} by ${qtyChange}`);
      target.producedQty = (target.producedQty || 0) + Number(qtyChange);
      target.remainingQty = Math.max(target.targetQty - target.producedQty, 0);
      target.status = target.producedQty >= target.targetQty ? 'completed' :
                      target.producedQty > 0 ? 'in-progress' : 'pending';
      await target.save();
    } else {
      console.warn(`[TARGET NOT FOUND] for product: ${normalizedProduct}, size: ${normalizedSize}, date: ${date}, operator: ${normalizedOperator}`);
    }
  } catch (error) {
    console.error("Error updating target progress:", error);
  }
};

// @desc    Create or Update a production record (combine same sizes for today)
// @route   POST /api/production
// @access  Private
const createProduction = async (req, res) => {
  try {
    const { date, operator, product, size, grade, quantity, time } = req.body;
    const qty = parseInt(quantity || 0);
    const normalizedProduct = (product || "").trim();
    const normalizedSize = (size || "").trim();
    const normalizedOperator = (operator || "").trim();

    // Update the Production Plan Target
    await updateTargetProgress(date, normalizedSize, qty, normalizedOperator, normalizedProduct);
    
    // Check if exactly matching record exists
    const existing = await Production.findOne({
      date, 
      operator: normalizedOperator, 
      product: normalizedProduct, 
      size: normalizedSize, 
      grade
    });

    if (existing) {
      existing.quantity += qty;
      existing.time = time;
      existing.recordedBy = req.employee?.name || 'Unknown';
      await existing.save();
      return res.status(200).json(existing);
    }

    const recordData = {
      ...req.body,
      product: normalizedProduct,
      size: normalizedSize,
      operator: normalizedOperator,
      recordedBy: req.employee?.name || 'Unknown'
    };
    const record = await Production.create(recordData);
    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a production record
// @route   PUT /api/production/:id
// @access  Private
const updateProduction = async (req, res) => {
  try {
    const record = await Production.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Handle target update for quantity/size/date/operator change
    if (req.body.quantity !== undefined || req.body.size !== undefined || req.body.date !== undefined || req.body.operator !== undefined || req.body.product !== undefined) {
      const oldQty = record.quantity || 0;
      const newQty = req.body.quantity !== undefined ? parseInt(req.body.quantity) : oldQty;
      const oldOperator = record.operator;
      const newOperator = req.body.operator !== undefined ? req.body.operator : oldOperator;
      const oldProduct = record.product;
      const newProduct = req.body.product !== undefined ? req.body.product : oldProduct;
      
      const isSameTarget = 
          record.date === (req.body.date || record.date) && 
          record.size === (req.body.size || record.size) &&
          oldOperator === newOperator &&
          oldProduct === newProduct;

      if (isSameTarget) {
        // Simple quantity change on same target
        await updateTargetProgress(record.date, record.size, newQty - oldQty, oldOperator, oldProduct);
      } else {
        // Target attributes changed: decrement old, increment new
        await updateTargetProgress(record.date, record.size, -oldQty, oldOperator, oldProduct);
        await updateTargetProgress(req.body.date || record.date, req.body.size || record.size, newQty, newOperator, newProduct);
      }
    }

    const updatedRecord = await Production.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedRecord);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// @desc    Delete a production record
// @route   DELETE /api/production/:id
// @access  Private
const deleteProduction = async (req, res) => {
  try {
    const record = await Production.findById(req.params.id);

    if (record) {
      // Decrement target progress
      await updateTargetProgress(record.date, record.size, -(record.quantity || 0), record.operator, record.product);
      
      await Production.deleteOne({ _id: record._id });
      res.json({ message: 'Production record removed' });
    } else {
      res.status(404).json({ message: 'Production record not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clear all production records
// @route   DELETE /api/production
// @access  Private
const clearAllProduction = async (req, res) => {
  try {
    const { date } = req.query;
    if (date) {
      // 1. Find all records for this date to update targets
      const records = await Production.find({ date });
      for (const record of records) {
        await updateTargetProgress(record.date, record.size, -(record.quantity || 0), record.operator, record.product);
      }
      // 2. Clear records for this date
      await Production.deleteMany({ date });
      res.json({ message: `Production records for ${date} cleared` });
    } else {
      // Global clear (be careful, this doesn't reset targets in this simple version, 
      // but usually users won't use this if date-specific exists)
      await Production.deleteMany({});
      res.json({ message: 'All production records cleared' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProduction,
  createProduction,
  updateProduction,
  deleteProduction,
  clearAllProduction,
};
