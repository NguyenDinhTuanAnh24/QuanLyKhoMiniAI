const notificationService = require('../services/NotificationService');

class NotificationController {
  async getNotifications(req, res, next) {
    try {
      const { page = 1, limit = 15, status = 'ALL', type = 'ALL' } = req.query;
      const user_id = req.user.user_id; // Strictly from auth middleware
      
      if (!user_id) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const result = await notificationService.getNotifications(user_id, { page, limit, status, type });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const user_id = req.user.user_id;
      if (!user_id) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const count = await notificationService.getUnreadCount(user_id);
      res.json({ success: true, data: { unreadCount: count } });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const user_id = req.user.user_id; // Secure recipient enforcement
      
      if (!user_id) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      await notificationService.markAsRead(id, user_id);
      res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const user_id = req.user.user_id; // Secure recipient enforcement
      
      if (!user_id) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      await notificationService.markAllAsRead(user_id);
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
