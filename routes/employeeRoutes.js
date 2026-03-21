const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require('../controllers/employeeController');
const { verifyToken, checkAccess } = require('../middleware/authMiddleware');

router.route('/')
  .get(verifyToken, checkAccess('employees'), getEmployees)
  .post(verifyToken, checkAccess('employees'), createEmployee);

router.route('/:id')
  .get(verifyToken, checkAccess('employees'), getEmployeeById)
  .put(verifyToken, checkAccess('employees'), updateEmployee)
  .delete(verifyToken, checkAccess('employees'), deleteEmployee);

module.exports = router;
