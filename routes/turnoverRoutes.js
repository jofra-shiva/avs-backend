const express = require('express');
const router = express.Router();
<<<<<<< HEAD
const turnoverController = require('../controllers/turnoverController');
const { verifyToken, checkAccess } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(checkAccess('turnover'));

router.get('/', turnoverController.getTurnoverSummary);
router.get('/analytics', turnoverController.getAnalytics);
=======
const { getTurnoverAnalytics } = require('../controllers/turnoverController');
const { verifyToken, checkAccess } = require('../middleware/authMiddleware');

// Get turnover analytics
// Supports ?type=daily, monthly, yearly, all
router.get('/analytics', verifyToken, checkAccess('turnover'), getTurnoverAnalytics);

// Legacy/Compatibility support for direct route
router.get('/monthly', verifyToken, checkAccess('turnover'), getTurnoverAnalytics);
>>>>>>> 9a2c2f56d86f12dfc80c527d3013ce8c50eaa58a

module.exports = router;
