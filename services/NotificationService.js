const NotificationRepository = require('../repositories/NotificationRepository');

class NotificationService {
    static async createNotification(recipient, message, type, relatedId) {
        return await NotificationRepository.createNotification(recipient, message, type, relatedId);
    }

    static async readNotification(notificationId) {
        return await NotificationRepository.readNotification(notificationId);
    }

    static async fetchNotifications() {
        return await NotificationRepository.fetchNotifications();
    }

    static async markNotificationAsRead(notificationId) {
        const notification = await NotificationRepository.markNotificationAsRead(notificationId);
        return notification;
    }

    static async getUserNotifications(gUserID, isRead = false) {
        return await NotificationRepository.getUserNotifications(gUserID, isRead);
    }
}

module.exports = NotificationService;