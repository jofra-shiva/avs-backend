const express = require('express');
const router = express.Router();
const {
  getProduction,
  createProduction,
  deleteProduction,
} = require('../controllers/productionController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getProduction)
  .post(protect, createProduction);

router.route('/:id')
  .delete(protect, deleteProduction);

module.exports = router;
