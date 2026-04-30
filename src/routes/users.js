const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');

// Rutas de usuarios
router.get('/', UserController.getAll);
router.get('/:id', UserController.getById);
router.post('/', UserController.create);
router.patch('/:id', UserController.update);
router.delete('/:id', UserController.delete);

module.exports = router;
