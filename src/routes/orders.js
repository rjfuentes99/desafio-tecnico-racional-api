const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');

// Rutas de órdenes
router.delete('/:id', OrderController.delete);

module.exports = router;
