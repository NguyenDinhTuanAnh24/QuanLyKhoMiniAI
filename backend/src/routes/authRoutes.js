const express = require('express');
const AuthController = require('../controllers/AuthController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/login', AuthController.login);
router.post('/logout', authMiddleware, AuthController.logout);
router.post('/change-password', AuthController.changePassword);

module.exports = router;
