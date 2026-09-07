import request from 'supertest';
import app from '../app';
import { connectDB, closeDB } from '../config/db';
import { seedInitialData } from '../seed/seedData';

describe('Authentication, RBAC and API Endpoints Integration Tests', () => {
  beforeAll(async () => {
    await connectDB();
    await seedInitialData();
  });

  afterAll(async () => {
    await closeDB();
  });

  test('Health check endpoint returns status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('budget-monitoring-api');
  });

  test('Admin login succeeds with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@gov.in', password: 'Admin@123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('ADMIN');
  });

  test('Login fails with invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@gov.in', password: 'WrongPassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('RBAC: Finance Officer cannot access admin user management', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'finance@gov.in', password: 'Finance@123' });

    const financeToken = loginRes.body.data.token;

    const usersRes = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${financeToken}`);

    expect(usersRes.status).toBe(403);
    expect(usersRes.body.success).toBe(false);
  });

  test('Admin can access users list and audit logs', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@gov.in', password: 'Admin@123' });

    const adminToken = loginRes.body.data.token;

    const usersRes = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(usersRes.status).toBe(200);
    expect(usersRes.body.data.length).toBeGreaterThan(0);

    const auditRes = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(auditRes.status).toBe(200);
    expect(auditRes.body.data.length).toBeGreaterThan(0);
  });

  test('Dashboard Summary endpoint returns populated financial metrics', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@gov.in', password: 'Admin@123' });

    const token = loginRes.body.data.token;

    const summaryRes = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.data.totalBudget).toBeGreaterThan(0);
    expect(summaryRes.body.data.totalSpent).toBeGreaterThan(0);
    expect(summaryRes.body.data.activeAlerts).toBeGreaterThan(0);
  });
});
