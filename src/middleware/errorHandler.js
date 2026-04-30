/**
 * Middleware de manejo de errores global
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Error de validación de PostgreSQL
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      details: err.detail
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      error: 'Foreign key constraint violation',
      details: err.detail
    });
  }

  if (err.code === '22P02') {
    return res.status(400).json({
      success: false,
      error: 'Invalid input syntax'
    });
  }

  // Error genérico
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
};

/**
 * Middleware para rutas no encontradas
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
};

module.exports = { errorHandler, notFound };
