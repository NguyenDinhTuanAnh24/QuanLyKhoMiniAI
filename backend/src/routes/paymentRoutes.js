const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/PaymentController');

router.post('/payos/create', PaymentController.createPayOSPayment);
router.post('/payos/webhook', PaymentController.handlePayOSWebhook);

module.exports = router;
