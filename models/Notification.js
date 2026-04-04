const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: false, // System notifications may not have a sender
    },
    type: {
      type: String,
      required: true,
      enum: ['attendance', 'sale', 'production', 'admin_push', 'system', 'feedback'],
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
      required: false,
    },
    // TTL Index: Automatically delete after 24 hours (86400 seconds)
    createdAt: { 
      type: Date, 
      default: Date.now, 
      index: { expires: 86400 } 
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);

