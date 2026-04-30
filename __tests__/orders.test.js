const request = require('supertest');
const app = require('../src/app');

describe('Stock Orders API', () => {
  let portfolioId;

  beforeAll(async () => {
    const usersRes = await request(app).get('/api/users');
    const user = usersRes.body.data[0];
    const portfoliosRes = await request(app).get(`/api/users/${user.id}/portfolios`);
    portfolioId = portfoliosRes.body.data[0].id;
  });

  test('Debe rechazar compra sin fondos suficientes', async () => {
    const response = await request(app)
      .post(`/api/portfolios/${portfolioId}/orders`)
      .send({
        type: 'buy',
        symbol: 'AAPL',
        quantity: 1000000,
        price_per_share: 150,
        date: new Date().toISOString()
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Insufficient funds');
  });

  test('Debe rechazar venta sin acciones suficientes', async () => {
    const response = await request(app)
      .post(`/api/portfolios/${portfolioId}/orders`)
      .send({
        type: 'sell',
        symbol: 'AAPL',
        quantity: 1000000,
        price_per_share: 150,
        date: new Date().toISOString()
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/Insufficient shares|No position found/);
  });

  test('Debe crear orden de compra válida', async () => {
    await request(app)
      .post(`/api/portfolios/${portfolioId}/movements`)
      .send({
        type: 'deposit',
        amount: 10000,
        date: new Date().toISOString(),
        description: 'Test deposit'
      });

    const response = await request(app)
      .post(`/api/portfolios/${portfolioId}/orders`)
      .send({
        type: 'buy',
        symbol: 'TEST',
        quantity: 10,
        price_per_share: 100,
        date: new Date().toISOString()
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.symbol).toBe('TEST');
  });

  test('Debe rechazar retiro con fondos insuficientes', async () => {
    const response = await request(app)
      .post(`/api/portfolios/${portfolioId}/movements`)
      .send({
        type: 'withdrawal',
        amount: 999999999,
        date: new Date().toISOString(),
        description: 'Test overdraft'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Insufficient funds');
  });
});
