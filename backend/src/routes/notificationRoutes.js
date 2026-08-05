const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/NotificationController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', notificationController.getNotifications);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);
router.post('/', notificationController.createNotification);

module.exports = router;

