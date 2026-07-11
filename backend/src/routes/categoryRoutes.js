const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/CategoryController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/authorizeRoles');
const { ROLES } = require('../config/permissions');

const ADMIN_OWNER = [ROLES.ADMIN, ROLES.OWNER];
const WAREHOUSE = [ROLES.WAREHOUSE_STAFF];
const SALES = [ROLES.SALES_STAFF];

router.use(authMiddleware);

router.get('/', authorizeRoles(...ADMIN_OWNER, ...WAREHOUSE, ...SALES), CategoryController.getCategories);
router.get('/:id', authorizeRoles(...ADMIN_OWNER, ...WAREHOUSE, ...SALES), CategoryController.getCategoryById);
router.post('/', authorizeRoles(...ADMIN_OWNER, ...WAREHOUSE), CategoryController.createCategory);
router.put('/:id', authorizeRoles(...ADMIN_OWNER, ...WAREHOUSE), CategoryController.updateCategory);
router.delete('/:id', authorizeRoles(...ADMIN_OWNER, ...WAREHOUSE), CategoryController.deleteCategory);

module.exports = router;
