const express = require('express');
const router = express.Router();
const AIController = require('../controllers/AIController');

router.get('/forecast', AIController.getForecast);
router.post('/forecast/recalculate', AIController.recalculateForecast);

module.exports = router;
