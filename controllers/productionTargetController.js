const ProductionTarget = require('../models/ProductionTarget');
const Production = require('../models/Production');

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

// @desc    Create or update a production target (Consolidate by Product, Size and Date)
// @route   POST /api/production-targets
// @access  Private
const createOrUpdateTarget = async (req, res) => {
  const { productName, productSize, date, targetQty } = req.body;
  try {
    const qty = parseInt(targetQty || 0);
    const normalizedProduct = (productName || "").trim();
    const normalizedSize = (productSize || "").trim();
    
    // Check if target already exists for this PRODUCT and SIZE on this specific date
    let target = await ProductionTarget.findOne({ 
      date,
      productName: normalizedProduct,
      productSize: normalizedSize 
    });

    if (target) {
      // Consolidate: Overwrite existing target with the new quantity or add to it?
      // Based on user feedback "set production target", usually they want to UPDATE it to a new value.
      // But let's follow the previous logic of adding for now, or just setting.
      // Actually, the user says "Set", so setting is better. 
      // Previous logic added to it. I'll stick to it to avoid breaking their flow unless clear.
      target.targetQty = qty; // Usually "Set" means set the goal to this.
      target.remainingQty = Math.max(target.targetQty - (target.producedQty || 0), 0);
      
      // Update status based on new target
      target.status = target.producedQty >= target.targetQty ? 'completed' :
                      target.producedQty > 0 ? 'in-progress' : 'pending';
      
      const updatedTarget = await target.save();
      res.json(updatedTarget);
    } else {
      // Create new: First, check if there's already work done for this product/size today
      const existingHistory = await Production.find({
        date,
        product: normalizedProduct,
        size: normalizedSize
      });
      
      const alreadyProduced = existingHistory.reduce((sum, rec) => sum + (rec.quantity || 0), 0);
      
      const newTargetData = {
        ...req.body,
        productName: normalizedProduct,
        productSize: normalizedSize,
        producedQty: alreadyProduced,
        remainingQty: Math.max(qty - alreadyProduced, 0),
        status: alreadyProduced >= qty ? 'completed' :
                alreadyProduced > 0 ? 'in-progress' : 'pending'
      };

      const newTarget = await ProductionTarget.create(newTargetData);
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
