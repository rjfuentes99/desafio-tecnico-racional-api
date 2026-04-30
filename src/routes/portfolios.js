const express = require('express');
const router = express.Router();
const PortfolioController = require('../controllers/portfolioController');

// Rutas de portafolios
router.get('/:id', PortfolioController.getById);
router.patch('/:id', PortfolioController.update);
router.delete('/:id', PortfolioController.delete);
router.get('/:id/total', PortfolioController.getTotal);

module.exports = router;
