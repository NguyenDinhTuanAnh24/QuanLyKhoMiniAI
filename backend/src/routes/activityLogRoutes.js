const express = require('express');
const router = express.Router();
const ActivityLogController = require('../controllers/ActivityLogController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/authorizeRoles');

// Chỉ cho phép admin xem nhật ký hoạt động
router.get('/', authMiddleware, authorizeRoles('ADMIN', 'OWNER'), ActivityLogController.getLogs);

module.exports = router;
