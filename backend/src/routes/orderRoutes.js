const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/OrderController');

router.post('/', OrderController.createOrder);
router.get('/', OrderController.getRecentOrders);
router.get('/:orderId/payment-status', OrderController.getPaymentStatus);
router.get('/statistics/product-consumption', OrderController.getProductConsumption);

module.exports = router;
