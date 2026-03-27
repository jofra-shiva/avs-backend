const Notification = require('../models/Notification');
const Employee = require('../models/Employee');

/**
 * Creates a notification for a specific user or all admins.
 * 
 * @param {Object} options 
 * @param {String} options.recipientId - ID of the user to receive the notification. If null, will send to all admins.
 * @param {String} options.senderId - ID of the user who sent the notification (optional).
 * @param {String} options.type - Type of notification (attendance, sale, production, admin_push).
 * @param {String} options.title - Short title.
 * @param {String} options.message - Detailed message.
 * @param {String} options.link - Optional link for navigation.
 */
const createNotification = async ({ recipientId, senderId, type, title, message, link }) => {
  try {
    if (recipientId) {
      // Send to specific user
      await Notification.create({
        recipient: recipientId,
        sender: senderId,
        type,
        title,
        message,
        link
      });
    } else {
      // Send to all admins
      const admins = await Employee.find({ role: 'admin' });
      const notifications = admins.map(admin => ({
        recipient: admin._id,
        sender: senderId,
        type,
        title,
        message,
        link
      }));
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error('Error creating notification:', error.message);
  }
};

module.exports = { createNotification };
