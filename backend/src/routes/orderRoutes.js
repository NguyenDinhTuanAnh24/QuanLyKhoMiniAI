const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/OrderController');

router.post('/', OrderController.createOrder);
router.get('/', OrderController.getRecentOrders);
router.get('/:orderId/payment-status', OrderController.getPaymentStatus);

module.exports = router;
