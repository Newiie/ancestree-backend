const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['MATCH', 'FRIEND_REQUEST', 'GENERAL'], default: 'GENERAL' },
  relatedId: { type: mongoose.Schema.Types.ObjectId }, 
  createdAt: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false }
});

NotificationSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.notificationId = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

const Notification = mongoose.model('Notification', NotificationSchema);

module.exports = Notification;
