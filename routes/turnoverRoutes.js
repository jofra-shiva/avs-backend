const express = require('express');
const router = express.Router();
const turnoverController = require('../controllers/turnoverController');
const { verifyToken, checkAccess } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(checkAccess('turnover'));

router.get('/', turnoverController.getTurnoverSummary);
router.get('/analytics', turnoverController.getAnalytics);

module.exports = router;
