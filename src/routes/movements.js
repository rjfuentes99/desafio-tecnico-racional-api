const express = require('express');
const router = express.Router();
const MovementController = require('../controllers/movementController');

// Rutas de movimientos
router.delete('/:id', MovementController.delete);

module.exports = router;
