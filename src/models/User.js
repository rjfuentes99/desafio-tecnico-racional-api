const pool = require('../config/database');

class User {
  /**
   * Crear un nuevo usuario
   */
  static async create(email, name, phone) {
    const query = `
      INSERT INTO users (email, name, phone)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [email, name, phone];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Obtener usuario por ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Obtener usuario por email
   */
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  /**
   * Obtener todos los usuarios
   */
  static async findAll() {
    const query = 'SELECT * FROM users ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Actualizar información del usuario
   */
  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Construir dinámicamente la query según los campos a actualizar
    if (updates.email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      values.push(updates.email);
    }
    if (updates.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.phone !== undefined) {
      fields.push(`phone = $${paramIndex++}`);
      values.push(updates.phone);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Eliminar usuario
   */
  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = User;
