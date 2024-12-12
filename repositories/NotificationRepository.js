const Notification = require("../models/Notification.js");

class NotificationRepository {
    static async createNotification(recipient, message, type, relatedId) {
        const notification = new Notification({
            recipient,
            message,
            type,
            relatedId,
        });
        await notification.save();
        return notification;
    }

    static async readNotification(notificationId) {
        const notification = await Notification.findById(notificationId);
        if (!notification) {
            throw new Error('Notification not found');
        }
        notification.isRead = true;
        await notification.save();
        return notification;
    }

    static async markNotificationAsRead(notificationId) {
        const notification = await Notification.findById(notificationId);
        if (!notification) {
            throw new Error('Notification not found');
        }
        notification.isRead = true;
        await notification.save();
        return notification;
    }

    static async getUserNotifications(gUserID, isRead = false) {
        const notifications = await Notification.find({ recipient: gUserID });
        return notifications;
    }
}

module.exports = NotificationRepository;