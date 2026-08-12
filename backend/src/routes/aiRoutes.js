const express = require('express');
const router = express.Router();
const AIController = require('../controllers/AIController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/authorizeRoles');
const { ROLES } = require('../config/permissions');

const ADMIN_OWNER = [ROLES.ADMIN, ROLES.OWNER];

router.use(authMiddleware);
router.use(authorizeRoles(...ADMIN_OWNER));

router.get('/settings', AIController.getSettings);
router.put('/settings', AIController.updateSettings);

router.get('/forecast', AIController.getForecast);
router.post('/analyze', AIController.analyze);
router.get('/analysis-runs/:runId', AIController.getAnalysisProgress);
router.get('/recommendations', AIController.getRecommendations);
router.post('/recommendations/apply-bulk', AIController.applyBulkRecommendations);
router.post('/recommendations/:id/apply', AIController.applyRecommendation);
router.post('/recommendations/:id/ignore', AIController.ignoreRecommendation);
router.post('/test-connection', AIController.testConnection);

module.exports = router;
