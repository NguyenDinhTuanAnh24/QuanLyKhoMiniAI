const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/PaymentController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/payos/create', authMiddleware, PaymentController.createPayOSPayment);
router.post('/payos/webhook', PaymentController.handlePayOSWebhook);

module.exports = router;
