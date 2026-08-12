const express = require('express');
const router = express.Router();
const SettingController = require('../controllers/SettingController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/authorizeRoles');
const { ROLES } = require('../config/permissions');
const multer = require('multer');

const ADMIN_OWNER = [ROLES.ADMIN, ROLES.OWNER];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

router.use(authMiddleware);

// Public branding endpoint (for all authenticated users)
router.get('/branding', SettingController.getBranding);

// All settings routes restricted to Admin and Owner
router.use(authorizeRoles(...ADMIN_OWNER));

router.get('/', SettingController.getSettings);
router.put('/', SettingController.updateSettings);
router.post('/logo', upload.single('image'), SettingController.uploadLogo);

module.exports = router;
