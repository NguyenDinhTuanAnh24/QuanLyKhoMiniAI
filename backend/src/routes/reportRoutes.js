const express = require('express');
const router = express.Router();
const reportController = require('../controllers/ReportController');

router.get('/overview', reportController.getOverview);
router.get('/revenue', reportController.getRevenue);
router.get('/inventory', reportController.getInventory);
router.get('/stock-movements', reportController.getStockMovements);
router.get('/top-selling', reportController.getTopSelling);
router.get('/imports', reportController.getImports);
router.get('/slow-selling', reportController.getSlowSelling);

module.exports = router;
