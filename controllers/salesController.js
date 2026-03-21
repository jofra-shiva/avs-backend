const Sale = require('../models/Sale');

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
const getSales = async (req, res) => {
  try {
    const sales = await Sale.find({}).sort({ createdAt: -1 });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Log a new sale
// @route   POST /api/sales
// @access  Private
const logSale = async (req, res) => {
  try {
    const saleData = {
      ...req.body,
      recordedBy: req.employee?.name || 'Unknown'
    };
    const sale = await Sale.create(saleData);
    res.status(201).json(sale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a sale
// @route   PUT /api/sales/:id
// @access  Private
const updateSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    const updated = await Sale.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a sale
// @route   DELETE /api/sales/:id
// @access  Private
const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (sale) {
      await Sale.deleteOne({ _id: sale._id });
      res.json({ message: 'Sale removed' });
    } else {
      res.status(404).json({ message: 'Sale not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSales,
  logSale,
  updateSale,
  deleteSale,
};
