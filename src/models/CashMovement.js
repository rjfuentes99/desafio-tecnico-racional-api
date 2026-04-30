const pool = require('../config/database');

class CashMovement {
  /**
   * Registrar un movimiento de efectivo (depósito o retiro)
   */
  static async create(portfolioId, type, amount, date, description) {
    const query = `
      INSERT INTO cash_movements (portfolio_id, type, amount, date, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [portfolioId, type, amount, date, description];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Obtener movimiento por ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM cash_movements WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Obtener todos los movimientos de un portafolio
   */
  static async findByPortfolioId(portfolioId, limit = 50) {
    const query = `
      SELECT * FROM cash_movements 
      WHERE portfolio_id = $1 
      ORDER BY date DESC, created_at DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [portfolioId, limit]);
    return result.rows;
  }

  /**
   * Obtener movimientos recientes de un usuario (todos sus portafolios)
   */
  static async findRecentByUserId(userId, limit = 20) {
    const query = `
      SELECT cm.*, p.name as portfolio_name
      FROM cash_movements cm
      JOIN portfolios p ON cm.portfolio_id = p.id
      WHERE p.user_id = $1
      ORDER BY cm.date DESC, cm.created_at DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }

  /**
   * Obtener balance de efectivo de un portafolio
   */
  static async getBalance(portfolioId) {
    const query = `
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END), 0) as total_deposits,
        COALESCE(SUM(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END), 0) as total_withdrawals,
        COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount ELSE -amount END), 0) as balance
      FROM cash_movements
      WHERE portfolio_id = $1
    `;
    const result = await pool.query(query, [portfolioId]);
    return result.rows[0];
  }

  /**
   * Eliminar movimiento
   */
  static async delete(id) {
    const query = 'DELETE FROM cash_movements WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = CashMovement;
