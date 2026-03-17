const express = require('express');
const router = express.Router();
const {
  getProductionTargets,
  createOrUpdateTarget,
  updateProducedQty,
  deleteProductionTarget,
  clearAllTargets,
} = require('../controllers/productionTargetController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getProductionTargets)
  .post(protect, createOrUpdateTarget)
  .delete(protect, clearAllTargets);

router.route('/:id')
  .put(protect, updateProducedQty)
  .delete(protect, deleteProductionTarget);

module.exports = router;
