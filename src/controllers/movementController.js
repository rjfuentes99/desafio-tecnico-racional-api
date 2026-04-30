const CashMovement = require('../models/CashMovement');
const Portfolio = require('../models/Portfolio');

class MovementController {
  /**
   * POST /api/portfolios/:portfolioId/movements - Registrar depósito o retiro
   */
  static async create(req, res) {
    try {
      const { portfolioId } = req.params;
      const { type, amount, date, description } = req.body;

      // Validaciones
      if (!type || !amount || !date) {
        return res.status(400).json({
          success: false,
          error: 'Type, amount and date are required'
        });
      }

      if (!['deposit', 'withdrawal'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Type must be either "deposit" or "withdrawal"'
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Amount must be greater than 0'
        });
      }

      // Validar que el portafolio existe
      const portfolio = await Portfolio.findById(portfolioId);
      if (!portfolio) {
        return res.status(404).json({
          success: false,
          error: 'Portfolio not found'
        });
      }

      // Si es retiro, validar que hay fondos suficientes
      if (type === 'withdrawal') {
        const balance = await CashMovement.getBalance(portfolioId);
        if (parseFloat(balance.balance) < amount) {
          return res.status(400).json({
            success: false,
            error: `Insufficient funds. Available: $${parseFloat(balance.balance).toFixed(2)}, Requested: $${amount.toFixed(2)}`
          });
        }
      }

      const movement = await CashMovement.create(
        portfolioId,
        type,
        amount,
        date,
        description
      );

      res.status(201).json({
        success: true,
        data: movement
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/portfolios/:portfolioId/movements - Obtener movimientos de un portafolio
   */
  static async getByPortfolio(req, res) {
    try {
      const { portfolioId } = req.params;
      const limit = parseInt(req.query.limit) || 50;

      // Validar que el portafolio existe
      const portfolio = await Portfolio.findById(portfolioId);
      if (!portfolio) {
        return res.status(404).json({
          success: false,
          error: 'Portfolio not found'
        });
      }

      const movements = await CashMovement.findByPortfolioId(portfolioId, limit);
      
      res.json({
        success: true,
        data: movements
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/users/:userId/movements/recent - Obtener movimientos recientes de un usuario
   */
  static async getRecentByUser(req, res) {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit) || 20;

      const movements = await CashMovement.findRecentByUserId(userId, limit);
      
      res.json({
        success: true,
        data: movements
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/portfolios/:portfolioId/movements/balance - Obtener balance de efectivo
   */
  static async getBalance(req, res) {
    try {
      const { portfolioId } = req.params;

      // Validar que el portafolio existe
      const portfolio = await Portfolio.findById(portfolioId);
      if (!portfolio) {
        return res.status(404).json({
          success: false,
          error: 'Portfolio not found'
        });
      }

      const balance = await CashMovement.getBalance(portfolioId);
      
      res.json({
        success: true,
        data: {
          portfolio_id: portfolioId,
          ...balance
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/movements/:id - Eliminar movimiento
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const movement = await CashMovement.delete(id);
      
      if (!movement) {
        return res.status(404).json({
          success: false,
          error: 'Movement not found'
        });
      }

      res.json({
        success: true,
        message: 'Movement deleted successfully',
        data: movement
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = MovementController;
