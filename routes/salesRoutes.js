const express = require('express');
const router = express.Router();
const { getSales, logSale, updateSale, deleteSale } = require('../controllers/salesController');

router.get('/', getSales);
router.post('/', logSale);
router.put('/:id', updateSale);
router.delete('/:id', deleteSale);

module.exports = router;
