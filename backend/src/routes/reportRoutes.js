const express = require('express');
const router = express.Router();
const reportController = require('../controllers/ReportController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/authorizeRoles');

router.use(authMiddleware);

router.get('/overview', authorizeRoles('ADMIN', 'OWNER'), reportController.getOverview);
router.get('/revenue', authorizeRoles('ADMIN', 'OWNER'), reportController.getRevenue);
router.get('/inventory', authorizeRoles('ADMIN', 'OWNER', 'WAREHOUSE_STAFF'), reportController.getInventory);
router.get('/stock-movements', authorizeRoles('ADMIN', 'OWNER', 'WAREHOUSE_STAFF'), reportController.getStockMovements);
router.get('/top-selling', authorizeRoles('ADMIN', 'OWNER', 'SALES_STAFF'), reportController.getTopSelling);
router.get('/imports', authorizeRoles('ADMIN', 'OWNER', 'WAREHOUSE_STAFF'), reportController.getImports);
router.get('/slow-selling', authorizeRoles('ADMIN', 'OWNER', 'SALES_STAFF'), reportController.getSlowSelling);

module.exports = router;
