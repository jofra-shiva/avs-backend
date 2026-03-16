const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require('../controllers/employeeController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getEmployees)
  .post(protect, createEmployee);

router.route('/:id')
  .get(protect, getEmployeeById)
  .put(protect, updateEmployee)
  .delete(protect, deleteEmployee);

module.exports = router;
