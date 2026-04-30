const User = require('../models/User');

class UserController {
  /**
   * GET /api/users - Obtener todos los usuarios
   */
  static async getAll(req, res) {
    try {
      const users = await User.findAll();
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/users/:id - Obtener usuario por ID
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/users - Crear nuevo usuario
   */
  static async create(req, res) {
    try {
      const { email, name, phone } = req.body;

      if (!email || !name) {
        return res.status(400).json({
          success: false,
          error: 'Email and name are required'
        });
      }

      const user = await User.create(email, name, phone);
      
      res.status(201).json({
        success: true,
        data: user
      });
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({
          success: false,
          error: 'Email already exists'
        });
      }
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * PATCH /api/users/:id - Actualizar usuario
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Validar que el usuario existe
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const user = await User.update(id, updates);
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          error: 'Email already exists'
        });
      }
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/users/:id - Eliminar usuario
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const user = await User.delete(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'User deleted successfully',
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = UserController;
