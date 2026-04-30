const StockOrder = require('../models/StockOrder');
const Portfolio = require('../models/Portfolio');

class OrderController {
  /**
   * POST /api/portfolios/:portfolioId/orders - Registrar orden de compra o venta
   */
  static async create(req, res) {
    try {
      const { portfolioId } = req.params;
      const { type, symbol, quantity, price_per_share, date } = req.body;

      // Validaciones
      if (!type || !symbol || !quantity || !price_per_share || !date) {
        return res.status(400).json({
          success: false,
          error: 'Type, symbol, quantity, price_per_share and date are required'
        });
      }

      if (!['buy', 'sell'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Type must be either "buy" or "sell"'
        });
      }

      if (quantity <= 0 || price_per_share <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Quantity and price_per_share must be greater than 0'
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

      if (type === 'buy') {
        const total = await Portfolio.calculateTotal(portfolioId);
        const orderCost = quantity * price_per_share;

        if (total.cash_balance < orderCost) {
          return res.status(400).json({
            success: false,
            error: `Insufficient funds. Available: $${total.cash_balance.toFixed(2)}, Required: $${orderCost.toFixed(2)}`
          });
        }
      }

      const order = await StockOrder.create(
        portfolioId,
        type,
        symbol,
        quantity,
        price_per_share,
        date
      );

      res.status(201).json({
        success: true,
        data: order
      });
    } catch (error) {
      // Manejo de errores específicos
      if (error.message.includes('Insufficient shares')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      if (error.message.includes('No position found')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/portfolios/:portfolioId/orders - Obtener órdenes de un portafolio
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

      const orders = await StockOrder.findByPortfolioId(portfolioId, limit);
      
      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/users/:userId/orders/recent - Obtener órdenes recientes de un usuario
   */
  static async getRecentByUser(req, res) {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit) || 20;

      const orders = await StockOrder.findRecentByUserId(userId, limit);
      
      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/portfolios/:portfolioId/orders/symbol/:symbol - Obtener historial de un símbolo
   */
  static async getBySymbol(req, res) {
    try {
      const { portfolioId, symbol } = req.params;

      // Validar que el portafolio existe
      const portfolio = await Portfolio.findById(portfolioId);
      if (!portfolio) {
        return res.status(404).json({
          success: false,
          error: 'Portfolio not found'
        });
      }

      const orders = await StockOrder.findBySymbol(portfolioId, symbol);
      
      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/orders/:id - Eliminar orden
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const order = await StockOrder.delete(id);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      res.json({
        success: true,
        message: 'Order deleted successfully',
        data: order
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = OrderController;
