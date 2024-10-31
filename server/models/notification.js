const mongoose = require("mongoose")

const NotificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    createdAt: { type: Date, default: Date.now }
});
  
const Notification = new mongoose.Schema('Notification', NotificationSchema);

module.exports = Notification