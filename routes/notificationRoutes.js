const express = require('express');
const router = express.Router();
const { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  sendPushNotification 
} = require('../controllers/notificationController');
const { verifyToken, adminOnly } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getNotifications);
router.put('/read-all', verifyToken, markAllAsRead);
router.put('/:id/read', verifyToken, markAsRead);
router.post('/send', verifyToken, adminOnly, sendPushNotification);

module.exports = router;
