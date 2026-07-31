const notificationService = require('../services/NotificationService');

class NotificationController {
  async getNotifications(req, res, next) {
    try {
      const { page = 1, limit = 15 } = req.query;
      const user_id = req.user?.user_id;
      const result = await notificationService.getNotifications(page, limit, user_id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      await notificationService.markAsRead(id);
      res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const user_id = req.user?.user_id;
      await notificationService.markAllAsRead(user_id);
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }

  async createNotification(req, res, next) {
    try {
      const result = await notificationService.createNotification(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
