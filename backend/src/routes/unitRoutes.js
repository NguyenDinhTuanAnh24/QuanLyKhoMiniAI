const express = require('express');
const router = express.Router();
const UnitController = require('../controllers/UnitController');

router.get('/', UnitController.getUnits);
router.get('/:id', UnitController.getUnitById);
router.post('/', UnitController.createUnit);
router.put('/:id', UnitController.updateUnit);
router.delete('/:id', UnitController.deleteUnit);

module.exports = router;
