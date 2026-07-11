const express = require('express');
const router = express.Router();
const UnitController = require('../controllers/UnitController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/authorizeRoles');
const { ROLES } = require('../config/permissions');

const ADMIN_OWNER = [ROLES.ADMIN, ROLES.OWNER];
const WAREHOUSE = [ROLES.WAREHOUSE_STAFF];
const SALES = [ROLES.SALES_STAFF];

router.use(authMiddleware);

router.get('/', authorizeRoles(...ADMIN_OWNER, ...WAREHOUSE, ...SALES), UnitController.getUnits);
router.get('/:id', authorizeRoles(...ADMIN_OWNER, ...WAREHOUSE, ...SALES), UnitController.getUnitById);
router.post('/', authorizeRoles(...ADMIN_OWNER, ...WAREHOUSE), UnitController.createUnit);
router.put('/:id', authorizeRoles(...ADMIN_OWNER, ...WAREHOUSE), UnitController.updateUnit);
router.delete('/:id', authorizeRoles(...ADMIN_OWNER, ...WAREHOUSE), UnitController.deleteUnit);

module.exports = router;
