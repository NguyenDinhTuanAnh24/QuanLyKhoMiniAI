const express = require('express');
const router = express.Router();
const SupplierController = require('../controllers/SupplierController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/authorizeRoles');
const { ROLES } = require('../config/permissions');

const ADMIN_OWNER = [ROLES.ADMIN, ROLES.OWNER];
const WAREHOUSE = [ROLES.WAREHOUSE_STAFF];
const SALES = [ROLES.SALES_STAFF];

router.use(authMiddleware);

router.get('/', authorizeRoles(...ADMIN_OWNER, ...WAREHOUSE, ...SALES), SupplierController.getSuppliers);
router.get('/:id', authorizeRoles(...ADMIN_OWNER, ...WAREHOUSE, ...SALES), SupplierController.getSupplierById);
router.post('/', authorizeRoles(...ADMIN_OWNER, ...WAREHOUSE), SupplierController.createSupplier);
router.put('/:id', authorizeRoles(...ADMIN_OWNER, ...WAREHOUSE), SupplierController.updateSupplier);
router.delete('/:id', authorizeRoles(...ADMIN_OWNER, ...WAREHOUSE), SupplierController.deleteSupplier);

module.exports = router;
