const express = require('express');
const router = express.Router();
const reportController = require('../controllers/ReportController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/authorizeRoles');
const { ROLES } = require('../config/permissions');

const ADMIN_OWNER = [ROLES.ADMIN, ROLES.OWNER];

router.use(authMiddleware);

router.get('/overview', authorizeRoles(...ADMIN_OWNER), reportController.getOverview);
router.get('/revenue', authorizeRoles(...ADMIN_OWNER), reportController.getRevenue);
router.get('/inventory', authorizeRoles(...ADMIN_OWNER, ROLES.WAREHOUSE_STAFF), reportController.getInventory);
router.get('/stock-movements', authorizeRoles(...ADMIN_OWNER, ROLES.WAREHOUSE_STAFF), reportController.getStockMovements);
router.get('/top-selling', authorizeRoles(...ADMIN_OWNER, ROLES.SALES_STAFF), reportController.getTopSelling);
router.get('/imports', authorizeRoles(...ADMIN_OWNER, ROLES.WAREHOUSE_STAFF), reportController.getImports);
router.get('/slow-selling', authorizeRoles(...ADMIN_OWNER, ROLES.SALES_STAFF), reportController.getSlowSelling);

module.exports = router;
