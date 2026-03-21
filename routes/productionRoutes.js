const express = require('express');
const router = express.Router();
const {
  getProduction,
  createProduction,
  updateProduction,
  deleteProduction,
  clearAllProduction,
} = require('../controllers/productionController');
const { verifyToken, checkAccess } = require('../middleware/authMiddleware');

// Before: router.route('/').get(protect, getProduction)...
// After: router.route('/').get(verifyToken, checkAccess('production'), getProduction)...

router.route('/')
  .get(verifyToken, checkAccess('production'), getProduction)
  .post(verifyToken, checkAccess('production'), createProduction)
  .delete(verifyToken, checkAccess('production'), clearAllProduction);

router.route('/:id')
  .put(verifyToken, checkAccess('production'), updateProduction)
  .delete(verifyToken, checkAccess('production'), deleteProduction);

module.exports = router;
