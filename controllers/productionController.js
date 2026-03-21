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

// @desc    Create or Update a production record (combine same sizes for today)
// @route   POST /api/production
// @access  Private
const createProduction = async (req, res) => {
  try {
    const { date, operator, product, size, grade, quantity, time } = req.body;
    
    // Check if exactly matching record exists
    const existing = await Production.findOne({
      date, operator, product, size, grade
    });

    if (existing) {
      existing.quantity += parseInt(quantity || 0);
      existing.time = time; // Update to the newest action time
      await existing.save();
      return res.status(200).json(existing);
    }

    const record = await Production.create(req.body);
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
