const express = require('express');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/users');
const portfolioRoutes = require('./routes/portfolios');
const movementRoutes = require('./routes/movements');
const orderRoutes = require('./routes/orders');

const PortfolioController = require('./controllers/portfolioController');
const MovementController = require('./controllers/movementController');
const OrderController = require('./controllers/orderController');

const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Racional Investment API',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      portfolios: '/api/portfolios',
      movements: '/api/movements',
      orders: '/api/orders'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// ============= RUTAS DE LA API =============

// USUARIOS
app.use('/api/users', userRoutes);

// PORTAFOLIOS (por usuario)
app.get('/api/users/:userId/portfolios', PortfolioController.getByUserId);
app.post('/api/users/:userId/portfolios', PortfolioController.create);

// PORTAFOLIOS (operaciones individuales)
app.use('/api/portfolios', portfolioRoutes);

// MOVIMIENTOS DE EFECTIVO (por portafolio)
app.get('/api/portfolios/:portfolioId/movements', MovementController.getByPortfolio);
app.post('/api/portfolios/:portfolioId/movements', MovementController.create);
app.get('/api/portfolios/:portfolioId/movements/balance', MovementController.getBalance);

// MOVIMIENTOS DE EFECTIVO (por usuario - últimos movimientos)
app.get('/api/users/:userId/movements/recent', MovementController.getRecentByUser);

// MOVIMIENTOS (operaciones individuales)
app.use('/api/movements', movementRoutes);

// ÓRDENES DE STOCK (por portafolio)
app.get('/api/portfolios/:portfolioId/orders', OrderController.getByPortfolio);
app.post('/api/portfolios/:portfolioId/orders', OrderController.create);
app.get('/api/portfolios/:portfolioId/orders/symbol/:symbol', OrderController.getBySymbol);

// ÓRDENES DE STOCK (por usuario - últimas órdenes)
app.get('/api/users/:userId/orders/recent', OrderController.getRecentByUser);

// ÓRDENES (operaciones individuales)
app.use('/api/orders', orderRoutes);

// ============= COMBINADO: TODOS LOS MOVIMIENTOS DE UN USUARIO =============
app.get('/api/users/:userId/activity', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    const CashMovement = require('./models/CashMovement');
    const StockOrder = require('./models/StockOrder');

    // Obtener movimientos de efectivo y órdenes en paralelo
    const [cashMovements, stockOrders] = await Promise.all([
      CashMovement.findRecentByUserId(userId, limit),
      StockOrder.findRecentByUserId(userId, limit)
    ]);

    // Combinar y ordenar por fecha
    const allActivity = [
      ...cashMovements.map(m => ({ ...m, activity_type: 'cash_movement' })),
      ...stockOrders.map(o => ({ ...o, activity_type: 'stock_order' }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);

    res.json({
      success: true,
      data: allActivity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Manejo de errores
app.use(notFound);
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 =======================================');
  console.log(`🚀 Racional API running on port ${PORT}`);
  console.log('🚀 =======================================');
  console.log('');
  console.log('📍 Available endpoints:');
  console.log(`   GET    http://localhost:${PORT}/`);
  console.log(`   GET    http://localhost:${PORT}/api/health`);
  console.log('');
  console.log('👤 Users:');
  console.log(`   GET    http://localhost:${PORT}/api/users`);
  console.log(`   POST   http://localhost:${PORT}/api/users`);
  console.log(`   PATCH  http://localhost:${PORT}/api/users/:id`);
  console.log('');
  console.log('💼 Portfolios:');
  console.log(`   GET    http://localhost:${PORT}/api/users/:userId/portfolios`);
  console.log(`   POST   http://localhost:${PORT}/api/users/:userId/portfolios`);
  console.log(`   GET    http://localhost:${PORT}/api/portfolios/:id/total`);
  console.log(`   PATCH  http://localhost:${PORT}/api/portfolios/:id`);
  console.log('');
  console.log('💰 Cash Movements:');
  console.log(`   POST   http://localhost:${PORT}/api/portfolios/:portfolioId/movements`);
  console.log(`   GET    http://localhost:${PORT}/api/portfolios/:portfolioId/movements`);
  console.log('');
  console.log('📈 Stock Orders:');
  console.log(`   POST   http://localhost:${PORT}/api/portfolios/:portfolioId/orders`);
  console.log(`   GET    http://localhost:${PORT}/api/portfolios/:portfolioId/orders`);
  console.log('');
  console.log('🔄 Recent Activity:');
  console.log(`   GET    http://localhost:${PORT}/api/users/:userId/activity`);
  console.log(`   GET    http://localhost:${PORT}/api/users/:userId/movements/recent`);
  console.log(`   GET    http://localhost:${PORT}/api/users/:userId/orders/recent`);
  console.log('');
});

module.exports = app;
