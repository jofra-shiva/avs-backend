const Notification = require('../models/Notification');
const Employee = require('../models/Employee');
const { createNotification } = require('../utils/notificationUtils');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.employee._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sender', 'name avatar');
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (notification && notification.recipient.toString() === req.employee._id.toString()) {
      notification.isRead = true;
      await notification.save();
      res.json(notification);
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.employee._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send custom push notification (Admin Only)
// @route   POST /api/notifications/send
// @access  Private/Admin
const sendPushNotification = async (req, res) => {
  try {
    const { recipientId, title, message, link } = req.body;
    
    // Validate target user(s)
    if (recipientId === 'all') {
      const employees = await Employee.find({ role: 'employee' });
      const notifications = employees.map(emp => ({
        recipient: emp._id,
        sender: req.employee._id,
        type: 'admin_push',
        title,
        message,
        link
      }));
      await Notification.insertMany(notifications);
      res.status(201).json({ message: 'Notifications sent to all employees' });
    } else {
      await createNotification({
        recipientId,
        senderId: req.employee._id,
        type: 'admin_push',
        title,
        message,
        link
      });
      res.status(201).json({ message: 'Notification sent successfully' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  sendPushNotification
};
