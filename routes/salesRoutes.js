const express = require('express');
const router = express.Router();
const {
  getSales,
  logSale,
  updateSale,
  deleteSale,
} = require('../controllers/salesController');
const { verifyToken, checkAccess } = require('../middleware/authMiddleware');

router.get('/', verifyToken, checkAccess('sales'), getSales);
router.post('/', verifyToken, checkAccess('sales'), logSale);
router.put('/:id', verifyToken, checkAccess('sales'), updateSale);
router.delete('/:id', verifyToken, checkAccess('sales'), deleteSale);

module.exports = router;
