const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/authorizeRoles');
const { ROLES } = require('../config/permissions');

const ADMIN_OWNER = [ROLES.ADMIN, ROLES.OWNER];

// Protect all user routes
router.use(authMiddleware);
router.get('/', authorizeRoles(...ADMIN_OWNER), UserController.getUsers);
router.get('/me', UserController.getMe);
router.put('/me', UserController.updateMe);
router.put('/me/password', UserController.updateMyPassword);

router.get('/:id', authorizeRoles(...ADMIN_OWNER), UserController.getUserById);
router.post('/', authorizeRoles(...ADMIN_OWNER), UserController.createUser);
router.put('/:id', authorizeRoles(...ADMIN_OWNER), UserController.updateUser);
router.delete('/:id', authorizeRoles(...ADMIN_OWNER), UserController.deleteUser);
router.patch('/:id/status', authorizeRoles(...ADMIN_OWNER), UserController.updateStatus);

module.exports = router;
