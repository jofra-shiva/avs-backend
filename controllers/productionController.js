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

// @desc    Create a production record
// @route   POST /api/production
// @access  Private
const createProduction = async (req, res) => {
  try {
    const record = await Production.create(req.body);
    res.status(201).json(record);
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
      await Production.deleteOne({ _id: record._id });
      res.json({ message: 'Production record removed' });
    } else {
      res.status(404).json({ message: 'Production record not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProduction,
  createProduction,
  deleteProduction,
};
