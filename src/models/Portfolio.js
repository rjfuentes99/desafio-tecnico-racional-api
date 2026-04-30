const pool = require('../config/database');

class Portfolio {
  /**
   * Crear un nuevo portafolio
   */
  static async create(userId, name, description) {
    const query = `
      INSERT INTO portfolios (user_id, name, description)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [userId, name, description];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Obtener portafolio por ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM portfolios WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Obtener todos los portafolios de un usuario
   */
  static async findByUserId(userId) {
    const query = 'SELECT * FROM portfolios WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Actualizar portafolio
   */
  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const query = `
      UPDATE portfolios 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Calcular el valor total de un portafolio
   * Retorna: { cash_balance, stock_value, total_value, positions }
   */
  static async calculateTotal(portfolioId) {
    const client = await pool.connect();
    try {
      // Calcular balance de efectivo (depósitos - retiros)
      const cashQuery = `
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END), 0) as total_deposits,
          COALESCE(SUM(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END), 0) as total_withdrawals
        FROM cash_movements
        WHERE portfolio_id = $1
      `;
      const cashResult = await client.query(cashQuery, [portfolioId]);
      const cashData = cashResult.rows[0];
      
      // Calcular balance neto de stocks (compras - ventas en dinero)
      const stockCashQuery = `
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'buy' THEN total_amount ELSE 0 END), 0) as total_buys,
          COALESCE(SUM(CASE WHEN type = 'sell' THEN total_amount ELSE 0 END), 0) as total_sells
        FROM stock_orders
        WHERE portfolio_id = $1
      `;
      const stockCashResult = await client.query(stockCashQuery, [portfolioId]);
      const stockCashData = stockCashResult.rows[0];

      const cashBalance = 
        parseFloat(cashData.total_deposits) - 
        parseFloat(cashData.total_withdrawals) - 
        parseFloat(stockCashData.total_buys) + 
        parseFloat(stockCashData.total_sells);

      // Obtener posiciones actuales
      const positionsQuery = `
        SELECT symbol, quantity, average_price, 
               (quantity * average_price) as position_value
        FROM portfolio_positions
        WHERE portfolio_id = $1 AND quantity > 0
      `;
      const positionsResult = await client.query(positionsQuery, [portfolioId]);
      const positions = positionsResult.rows;

      const stockValue = positions.reduce((sum, pos) => sum + parseFloat(pos.position_value), 0);
      const totalValue = cashBalance + stockValue;

      return {
        cash_balance: parseFloat(cashBalance.toFixed(2)),
        stock_value: parseFloat(stockValue.toFixed(2)),
        total_value: parseFloat(totalValue.toFixed(2)),
        positions: positions.map(p => ({
          symbol: p.symbol,
          quantity: parseInt(p.quantity),
          average_price: parseFloat(p.average_price),
          position_value: parseFloat(p.position_value)
        }))
      };
    } finally {
      client.release();
    }
  }

  /**
   * Eliminar portafolio
   */
  static async delete(id) {
    const query = 'DELETE FROM portfolios WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Portfolio;
