const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const { verifyToken, adminOnly } = require('../middleware/authMiddleware');

// Valid modules list - SINGLE SOURCE OF TRUTH
const VALID_MODULES = [
  "dashboard",
  "stock",
  "products",
  "production",
  "employees",
  "attendance",
  "clients",
  "sales",
  "reports"
];

// @route   GET /api/admin/modules
// @desc    Get all valid modules
// @access  Admin
router.get('/modules', verifyToken, adminOnly, (req, res) => {
  res.json(VALID_MODULES);
});

// @route   GET /api/admin/employees
// @desc    Get all non-admin employees with their modules
// @access  Admin
router.get('/employees', verifyToken, adminOnly, async (req, res) => {
  try {
    const employees = await Employee.find({ role: { $ne: 'admin' } })
      .select('-password')
      .sort({ name: 1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/admin/employees/:id/modules
// @desc    Update employee modules
// @access  Admin
router.put('/employees/:id/modules', verifyToken, adminOnly, async (req, res) => {
  const { modules } = req.body;

  if (!Array.isArray(modules)) {
    return res.status(400).json({ message: 'Modules must be an array' });
  }

  // Validate modules against allowed list
  const invalidModules = modules.filter(m => !VALID_MODULES.includes(m));
  if (invalidModules.length > 0) {
    return res.status(400).json({ 
      message: `Invalid module names: ${invalidModules.join(', ')}` 
    });
  }

  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    employee.modules = modules;
    await employee.save();

    res.json({ 
      message: 'Modules updated successfully',
      modules: employee.modules 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
