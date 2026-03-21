const express = require('express');
const router = express.Router();
const {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} = require('../controllers/expenseController');
const { verifyToken, checkAccess } = require('../middleware/authMiddleware');

// Before: router.route('/').get(protect, getExpenses)...
// After: router.route('/').get(verifyToken, checkAccess('stock'), getExpenses)...

router.route('/')
  .get(verifyToken, checkAccess('stock'), getExpenses)
  .post(verifyToken, checkAccess('stock'), createExpense);

router.route('/:id')
  .put(verifyToken, checkAccess('stock'), updateExpense)
  .delete(verifyToken, checkAccess('stock'), deleteExpense);

module.exports = router;
