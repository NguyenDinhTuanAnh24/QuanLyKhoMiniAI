const express = require('express');
const router = express.Router();
const AIController = require('../controllers/AIController');

router.get('/settings', AIController.getSettings);
router.put('/settings', AIController.updateSettings);

router.get('/forecast', AIController.getForecast);
router.post('/analyze', AIController.analyze);
router.get('/recommendations', AIController.getRecommendations);
router.post('/recommendations/:id/apply', AIController.applyRecommendation);
router.post('/recommendations/:id/ignore', AIController.ignoreRecommendation);
router.post('/test-connection', AIController.testConnection);

module.exports = router;
