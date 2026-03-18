const ProductionTarget = require('../models/ProductionTarget');

// @desc    Get all production targets
// @route   GET /api/production-targets
// @access  Private
const getProductionTargets = async (req, res) => {
  try {
    const targets = await ProductionTarget.find({}).sort({ createdAt: -1 });
    res.json(targets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create or update a production target
// @route   POST /api/production-targets
// @access  Private
const createOrUpdateTarget = async (req, res) => {
  const { productSize, operator, date } = req.body;
  try {
    // Check if target already exists for this size/operator combo
    let target = await ProductionTarget.findOne({ productSize, operator });

    if (target) {
      // Add to existing target
      target.targetQty += parseInt(req.body.targetQty);
      target.remainingQty += parseInt(req.body.targetQty);
      target.status = target.producedQty >= target.targetQty ? 'completed' :
                      target.producedQty > 0 ? 'in-progress' : 'pending';
      
      const updatedTarget = await target.save();
      res.json(updatedTarget);
    } else {
      // Create new
      const newTarget = await ProductionTarget.create(req.body);
      res.status(201).json(newTarget);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update produced quantity
// @route   PUT /api/production-targets/:id
// @access  Private
const updateProducedQty = async (req, res) => {
  try {
    const target = await ProductionTarget.findById(req.params.id);

    if (target) {
      target.producedQty = req.body.producedQty || target.producedQty;
      target.remainingQty = Math.max(target.targetQty - target.producedQty, 0);
      target.status = target.producedQty >= target.targetQty ? 'completed' :
                      target.producedQty > 0 ? 'in-progress' : 'pending';
      
      const updatedTarget = await target.save();
      res.json(updatedTarget);
    } else {
      res.status(404).json({ message: 'Target not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a production target
// @route   DELETE /api/production-targets/:id
// @access  Private
const deleteProductionTarget = async (req, res) => {
  try {
    const target = await ProductionTarget.findById(req.params.id);

    if (target) {
      await ProductionTarget.deleteOne({ _id: target._id });
      res.json({ message: 'Target removed' });
    } else {
      res.status(404).json({ message: 'Target not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clear all production targets
// @route   DELETE /api/production-targets
// @access  Private
const clearAllTargets = async (req, res) => {
  try {
    await ProductionTarget.deleteMany({});
    res.json({ message: 'All targets cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProductionTargets,
  createOrUpdateTarget,
  updateProducedQty,
  deleteProductionTarget,
  clearAllTargets,
};
