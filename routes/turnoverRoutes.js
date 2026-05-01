const express = require('express');
const router = express.Router();
const turnoverController = require('../controllers/turnoverController');
const { verifyToken, checkAccess } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(checkAccess('turnover'));

// Analytics Summary
router.get('/analytics', turnoverController.getAnalytics);
router.get('/summary', turnoverController.getTurnoverSummary);

// Manual Record CRUD
router.get('/', turnoverController.getManualTurnovers);
router.post('/', turnoverController.createTurnover);
router.put('/:id', turnoverController.updateTurnover);
router.delete('/:id', turnoverController.deleteTurnover);

// Legacy support
router.get('/monthly', turnoverController.getAnalytics);

module.exports = router;
