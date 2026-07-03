const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/DashboardController');

router.get('/overview', DashboardController.getOverview);

module.exports = router;
