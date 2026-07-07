const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Protect all user routes
router.use(authMiddleware);
router.get('/', UserController.getUsers);
router.get('/me', UserController.getMe);
router.put('/me', UserController.updateMe);
router.put('/me/password', UserController.updateMyPassword);

router.get('/:id', UserController.getUserById);
router.post('/', UserController.createUser);
router.put('/:id', UserController.updateUser);
router.delete('/:id', UserController.deleteUser);
router.patch('/:id/status', UserController.updateStatus);

module.exports = router;
