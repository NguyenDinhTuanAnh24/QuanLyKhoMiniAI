const express = require('express');
const router = express.Router();
const ActivityLogController = require('../controllers/ActivityLogController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/authorizeRoles');
const { ROLES } = require('../config/permissions');

// Chỉ cho phép admin và owner xem nhật ký hoạt động
router.get('/', authMiddleware, authorizeRoles(ROLES.ADMIN, ROLES.OWNER), ActivityLogController.getLogs);

module.exports = router;
