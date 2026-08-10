const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/authorizeRoles');
const { ROLES } = require('../config/permissions');
const multer = require('multer');

const ADMIN_OWNER = [ROLES.ADMIN, ROLES.OWNER];
const WAREHOUSE = [ROLES.WAREHOUSE_STAFF];
const SALES = [ROLES.SALES_STAFF];

router.use(authMiddleware);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Chỉ hỗ trợ ảnh PNG, JPG, JPEG hoặc WEBP"));
    }
    cb(null, true);
  },
});
router.get('/stats', authorizeRoles(...ADMIN_OWNER, ...WAREHOUSE, ...SALES), ProductController.getProductStats);
router.get('/', authorizeRoles(...ADMIN_OWNER, ...WAREHOUSE, ...SALES), ProductController.getProducts);
router.get('/:id', authorizeRoles(...ADMIN_OWNER, ...WAREHOUSE, ...SALES), ProductController.getProductById);
router.post('/', authorizeRoles(...ADMIN_OWNER, ...WAREHOUSE), ProductController.createProduct);
router.put('/:id', authorizeRoles(...ADMIN_OWNER, ...WAREHOUSE), ProductController.updateProduct);
router.delete('/:id', authorizeRoles(...ADMIN_OWNER, ...WAREHOUSE), ProductController.deleteProduct);
router.post('/:id/image', authorizeRoles(...ADMIN_OWNER, ...WAREHOUSE), upload.single('image'), ProductController.uploadProductImage);

module.exports = router;
