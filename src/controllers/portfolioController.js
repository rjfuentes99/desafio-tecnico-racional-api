const Portfolio = require('../models/Portfolio');
const User = require('../models/User');

class PortfolioController {
  /**
   * GET /api/portfolios/:id - Obtener portafolio por ID
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const portfolio = await Portfolio.findById(id);
      
      if (!portfolio) {
        return res.status(404).json({
          success: false,
          error: 'Portfolio not found'
        });
      }

      res.json({
        success: true,
        data: portfolio
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/users/:userId/portfolios - Obtener portafolios de un usuario
   */
  static async getByUserId(req, res) {
    try {
      const { userId } = req.params;
      
      // Validar que el usuario existe
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const portfolios = await Portfolio.findByUserId(userId);
      
      res.json({
        success: true,
        data: portfolios
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/users/:userId/portfolios - Crear nuevo portafolio
   */
  static async create(req, res) {
    try {
      const { userId } = req.params;
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Portfolio name is required'
        });
      }

      // Validar que el usuario existe
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const portfolio = await Portfolio.create(userId, name, description);
      
      res.status(201).json({
        success: true,
        data: portfolio
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * PATCH /api/portfolios/:id - Actualizar portafolio
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Validar que el portafolio existe
      const existingPortfolio = await Portfolio.findById(id);
      if (!existingPortfolio) {
        return res.status(404).json({
          success: false,
          error: 'Portfolio not found'
        });
      }

      const portfolio = await Portfolio.update(id, updates);
      
      res.json({
        success: true,
        data: portfolio
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/portfolios/:id/total - Obtener valor total del portafolio
   */
  static async getTotal(req, res) {
    try {
      const { id } = req.params;
      
      // Validar que el portafolio existe
      const portfolio = await Portfolio.findById(id);
      if (!portfolio) {
        return res.status(404).json({
          success: false,
          error: 'Portfolio not found'
        });
      }

      const total = await Portfolio.calculateTotal(id);
      
      res.json({
        success: true,
        data: {
          portfolio_id: id,
          portfolio_name: portfolio.name,
          ...total
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
   * DELETE /api/portfolios/:id - Eliminar portafolio
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const portfolio = await Portfolio.delete(id);
      
      if (!portfolio) {
        return res.status(404).json({
          success: false,
          error: 'Portfolio not found'
        });
      }

      res.json({
        success: true,
        message: 'Portfolio deleted successfully',
        data: portfolio
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = PortfolioController;
