const express = require('express');
const router = express.Router();
const { getTurnoverAnalytics } = require('../controllers/turnoverController');
const { verifyToken, checkAccess } = require('../middleware/authMiddleware');

// Get turnover analytics
// Supports ?type=daily, monthly, yearly, all
router.get('/analytics', verifyToken, checkAccess('turnover'), getTurnoverAnalytics);

// Legacy/Compatibility support for direct route
router.get('/monthly', verifyToken, checkAccess('turnover'), getTurnoverAnalytics);

module.exports = router;
