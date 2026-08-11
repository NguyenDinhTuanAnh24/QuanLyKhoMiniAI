const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/NotificationController');
const { protect } = require('../middleware/authMiddleware');

// All notification routes must be protected
router.use(protect);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;
