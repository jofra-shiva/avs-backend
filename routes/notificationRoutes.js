const express = require('express');
const router = express.Router();
const { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  sendPushNotification,
  respondToNotification
} = require('../controllers/notificationController');
const { verifyToken, adminOnly } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getNotifications);
router.put('/read-all', verifyToken, markAllAsRead);
router.put('/:id/read', verifyToken, markAsRead);
router.post('/:id/read', verifyToken, markAsRead);
router.post('/:id/respond', verifyToken, respondToNotification);
router.post('/send', verifyToken, adminOnly, sendPushNotification);

module.exports = router;
