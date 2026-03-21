const express = require('express');
const router = express.Router();
const {
  getProductionTargets,
  createOrUpdateTarget,
  updateProducedQty,
  deleteProductionTarget,
  clearAllTargets,
} = require('../controllers/productionTargetController');
const { verifyToken, checkAccess } = require('../middleware/authMiddleware');

router.route('/')
  .get(verifyToken, checkAccess('production'), getProductionTargets)
  .post(verifyToken, checkAccess('production'), createOrUpdateTarget)
  .delete(verifyToken, checkAccess('production'), clearAllTargets);

router.route('/:id')
  .put(verifyToken, checkAccess('production'), updateProducedQty)
  .delete(verifyToken, checkAccess('production'), deleteProductionTarget);

module.exports = router;
