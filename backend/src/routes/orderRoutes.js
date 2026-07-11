const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/OrderController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/authorizeRoles');
const { ROLES } = require('../config/permissions');

const ADMIN_OWNER = [ROLES.ADMIN, ROLES.OWNER];
const WAREHOUSE = [ROLES.WAREHOUSE_STAFF];
const SALES = [ROLES.SALES_STAFF];

router.use(authMiddleware);

router.post('/', authorizeRoles(...ADMIN_OWNER, ...SALES), OrderController.createOrder);
router.get('/', authorizeRoles(...ADMIN_OWNER, ...WAREHOUSE, ...SALES), OrderController.getRecentOrders);
router.get('/:orderId/payment-status', authorizeRoles(...ADMIN_OWNER, ...SALES), OrderController.getPaymentStatus);
router.get('/statistics/product-consumption', authorizeRoles(...ADMIN_OWNER, ...WAREHOUSE, ...SALES), OrderController.getProductConsumption);

module.exports = router;
