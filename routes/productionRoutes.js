const express = require('express');
const router = express.Router();
const {
  getProduction,
  createProduction,
  updateProduction,
  deleteProduction,
  clearAllProduction,
} = require('../controllers/productionController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getProduction)
  .post(protect, createProduction)
  .delete(protect, clearAllProduction);

router.route('/:id')
  .put(protect, updateProduction)
  .delete(protect, deleteProduction);

module.exports = router;
