const express = require('express');
const router = express.Router();
const {
  getSales,
  logSale,
  updateSale,
  deleteSale,
  clearAllSales,
} = require('../controllers/salesController');
const { verifyToken, checkAccess } = require('../middleware/authMiddleware');

router.get('/', verifyToken, checkAccess('sales'), getSales);
router.post('/', verifyToken, checkAccess('sales'), logSale);
router.put('/:id', verifyToken, checkAccess('sales'), updateSale);
router.delete('/:id', verifyToken, checkAccess('sales'), deleteSale);
router.delete('/', verifyToken, checkAccess('sales'), clearAllSales);

module.exports = router;
