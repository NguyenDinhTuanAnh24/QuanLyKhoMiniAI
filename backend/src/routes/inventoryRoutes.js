const express = require('express');
const router = express.Router();
const InventoryController = require('../controllers/InventoryController');

router.post('/movements', InventoryController.createMovement);
router.get('/movements', InventoryController.getMovements);

module.exports = router;
