const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/NotificationController');
const { authMiddleware } = require('../middleware/authMiddleware');

// All notification routes must be protected
router.use(authMiddleware);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;
