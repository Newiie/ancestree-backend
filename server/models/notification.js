const mongoose = require("mongoose")

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    createdAt: { type: Date, default: Date.now }
});
  
const Notification = new mongoose.Schema('Notification', notificationSchema);

module.exports = Notification