const express = require('express');
const router = express.Router();
const InventoryController = require('../controllers/InventoryController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/authorizeRoles');
const { ROLES } = require('../config/permissions');

const ADMIN_OWNER = [ROLES.ADMIN, ROLES.OWNER];
const WAREHOUSE = [ROLES.WAREHOUSE_STAFF];
const SALES = [ROLES.SALES_STAFF];

router.use(authMiddleware);

router.post('/movements', authorizeRoles(...ADMIN_OWNER, ...WAREHOUSE), InventoryController.createMovement);
router.get('/movements', authorizeRoles(...ADMIN_OWNER, ...WAREHOUSE, ...SALES), InventoryController.getMovements);
router.get('/low-stock-alerts', authorizeRoles(...ADMIN_OWNER, ...WAREHOUSE, ...SALES), InventoryController.getLowStockAlerts);

module.exports = router;
