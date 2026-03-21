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
const updateTargetProgress = async (date, productSize, qtyChange) => {
  try {
    // Find matching target
    const target = await ProductionTarget.findOne({ date, productSize });
    if (target) {
      target.producedQty = (target.producedQty || 0) + Number(qtyChange);
      target.remainingQty = Math.max(target.targetQty - target.producedQty, 0);
      target.status = target.producedQty >= target.targetQty ? 'completed' :
                      target.producedQty > 0 ? 'in-progress' : 'pending';
      await target.save();
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

    // Update the Production Plan Target
    await updateTargetProgress(date, size, qty);
    
    // Check if exactly matching record exists
    const existing = await Production.findOne({
      date, operator, product, size, grade
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

    // Handle target update for quantity change
    if (req.body.quantity !== undefined || req.body.size !== undefined || req.body.date !== undefined) {
      const oldQty = record.quantity || 0;
      const newQty = req.body.quantity !== undefined ? parseInt(req.body.quantity) : oldQty;
      
      if (record.date === (req.body.date || record.date) && record.size === (req.body.size || record.size)) {
        // Simple quantity change on same date/size
        await updateTargetProgress(record.date, record.size, newQty - oldQty);
      } else {
        // Date or Size changed: decrement old, increment new
        await updateTargetProgress(record.date, record.size, -oldQty);
        await updateTargetProgress(req.body.date || record.date, req.body.size || record.size, newQty);
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
      await updateTargetProgress(record.date, record.size, -(record.quantity || 0));
      
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
    await Production.deleteMany({});
    res.json({ message: 'All production records cleared' });
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
