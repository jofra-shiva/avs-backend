const express = require('express');
const router = express.Router();
const { verifyToken, checkAccess } = require('../middleware/authMiddleware');

// Before: router.get('/', getSales);
// After: router.get('/', verifyToken, checkAccess('sales'), getSales);

router.get('/', verifyToken, checkAccess('sales'), getSales);
router.post('/', verifyToken, checkAccess('sales'), logSale);
router.put('/:id', verifyToken, checkAccess('sales'), updateSale);
router.delete('/:id', verifyToken, checkAccess('sales'), deleteSale);

module.exports = router;
