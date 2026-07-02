const express = require('express');
const router = express.Router();
const SettingController = require('../controllers/SettingController');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

router.get('/', SettingController.getSettings);
router.put('/', SettingController.updateSettings);
router.post('/logo', upload.single('image'), SettingController.uploadLogo);

module.exports = router;
