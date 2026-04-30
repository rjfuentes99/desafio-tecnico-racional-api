const pool = require('../config/database');

class StockOrder {
  /**
   * Registrar una orden de stock (compra o venta)
   */
  static async create(portfolioId, type, symbol, quantity, pricePerShare, date) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const totalAmount = quantity * pricePerShare;

      // Insertar la orden
      const orderQuery = `
        INSERT INTO stock_orders (portfolio_id, type, symbol, quantity, price_per_share, total_amount, date)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const orderValues = [portfolioId, type, symbol.toUpperCase(), quantity, pricePerShare, totalAmount, date];
      const orderResult = await client.query(orderQuery, orderValues);
      const order = orderResult.rows[0];

      // Actualizar posiciones del portafolio
      await this.updatePositions(client, portfolioId, symbol.toUpperCase(), type, quantity, pricePerShare);

      await client.query('COMMIT');
      return order;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Actualizar posiciones del portafolio después de una orden
   */
  static async updatePositions(client, portfolioId, symbol, type, quantity, pricePerShare) {
    // Obtener posición actual
    const posQuery = 'SELECT * FROM portfolio_positions WHERE portfolio_id = $1 AND symbol = $2';
    const posResult = await client.query(posQuery, [portfolioId, symbol]);
    const currentPosition = posResult.rows[0];

    if (type === 'buy') {
      if (currentPosition) {
        // Actualizar posición existente (promedio ponderado)
        const currentValue = currentPosition.quantity * currentPosition.average_price;
        const newValue = quantity * pricePerShare;
        const totalQuantity = currentPosition.quantity + quantity;
        const newAveragePrice = (currentValue + newValue) / totalQuantity;

        const updateQuery = `
          UPDATE portfolio_positions 
          SET quantity = $1, average_price = $2
          WHERE portfolio_id = $3 AND symbol = $4
        `;
        await client.query(updateQuery, [totalQuantity, newAveragePrice, portfolioId, symbol]);
      } else {
        // Crear nueva posición
        const insertQuery = `
          INSERT INTO portfolio_positions (portfolio_id, symbol, quantity, average_price)
          VALUES ($1, $2, $3, $4)
        `;
        await client.query(insertQuery, [portfolioId, symbol, quantity, pricePerShare]);
      }
    } else if (type === 'sell') {
      if (currentPosition) {
        const newQuantity = currentPosition.quantity - quantity;
        
        if (newQuantity < 0) {
          throw new Error(`Insufficient shares. Available: ${currentPosition.quantity}, Trying to sell: ${quantity}`);
        }

        if (newQuantity === 0) {
          // Eliminar posición si se vendió todo
          const deleteQuery = 'DELETE FROM portfolio_positions WHERE portfolio_id = $1 AND symbol = $2';
          await client.query(deleteQuery, [portfolioId, symbol]);
        } else {
          // Actualizar cantidad (mantener precio promedio)
          const updateQuery = `
            UPDATE portfolio_positions 
            SET quantity = $1
            WHERE portfolio_id = $2 AND symbol = $3
          `;
          await client.query(updateQuery, [newQuantity, portfolioId, symbol]);
        }
      } else {
        throw new Error(`No position found for symbol ${symbol}`);
      }
    }
  }

  /**
   * Obtener orden por ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM stock_orders WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Obtener todas las órdenes de un portafolio
   */
  static async findByPortfolioId(portfolioId, limit = 50) {
    const query = `
      SELECT * FROM stock_orders 
      WHERE portfolio_id = $1 
      ORDER BY date DESC, created_at DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [portfolioId, limit]);
    return result.rows;
  }

  /**
   * Obtener órdenes recientes de un usuario (todos sus portafolios)
   */
  static async findRecentByUserId(userId, limit = 20) {
    const query = `
      SELECT so.*, p.name as portfolio_name
      FROM stock_orders so
      JOIN portfolios p ON so.portfolio_id = p.id
      WHERE p.user_id = $1
      ORDER BY so.date DESC, so.created_at DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }

  /**
   * Obtener historial de un símbolo específico
   */
  static async findBySymbol(portfolioId, symbol) {
    const query = `
      SELECT * FROM stock_orders 
      WHERE portfolio_id = $1 AND symbol = $2
      ORDER BY date DESC, created_at DESC
    `;
    const result = await pool.query(query, [portfolioId, symbol.toUpperCase()]);
    return result.rows;
  }

  /**
   * Eliminar orden (también revierte las posiciones)
   */
  static async delete(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Obtener la orden antes de eliminarla
      const orderQuery = 'SELECT * FROM stock_orders WHERE id = $1';
      const orderResult = await client.query(orderQuery, [id]);
      const order = orderResult.rows[0];

      if (!order) {
        throw new Error('Order not found');
      }

      // Revertir el efecto en las posiciones
      const reverseType = order.type === 'buy' ? 'sell' : 'buy';
      await this.updatePositions(
        client, 
        order.portfolio_id, 
        order.symbol, 
        reverseType, 
        order.quantity, 
        order.price_per_share
      );

      // Eliminar la orden
      const deleteQuery = 'DELETE FROM stock_orders WHERE id = $1 RETURNING *';
      const deleteResult = await client.query(deleteQuery, [id]);

      await client.query('COMMIT');
      return deleteResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = StockOrder;
