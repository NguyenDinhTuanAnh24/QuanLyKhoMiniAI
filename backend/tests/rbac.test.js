// globals injected by jest
const request = require('supertest');
const app = require('../server');
const { getTestSupabase } = require('./setup');
const bcrypt = require('bcryptjs');
const uuid = require('uuid');

const supabase = getTestSupabase();
let adminToken;
let salesToken;
let adminUserId;
let salesUserId;

describe('RBAC (Role-Based Access Control) API', () => {
  beforeAll(async () => {
    adminUserId = uuid.v4();
    salesUserId = uuid.v4();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password', salt);

    await supabase.from('app_users').insert([
      {
        user_id: adminUserId,
        email: 'test_rbac_admin@retail.com',
        password_hash: hashedPassword,
        full_name: 'TEST_ADMIN',
        role: 'ADMIN',
        status: 'Đang hoạt động'
      },
      {
        user_id: salesUserId,
        email: 'test_rbac_sales@retail.com',
        password_hash: hashedPassword,
        full_name: 'TEST_SALES',
        role: 'SALES_STAFF',
        status: 'Đang hoạt động'
      }
    ]);

    const resAdmin = await request(app).post('/api/auth/login').send({ email: 'test_rbac_admin@retail.com', password: 'password' });
    adminToken = resAdmin.body.data.token;

    const resSales = await request(app).post('/api/auth/login').send({ email: 'test_rbac_sales@retail.com', password: 'password' });
    salesToken = resSales.body.data.token;
  });

  afterAll(async () => {
    await supabase.from('activity_logs').delete().in('user_id', [adminUserId, salesUserId]);
    await supabase.from('app_users').delete().in('user_id', [adminUserId, salesUserId]);
  });

  it('TC-RBAC-01: ADMIN có quyền truy cập Users list', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });

  it('TC-RBAC-04: SALES_STAFF bị chặn truy cập Users list (403)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${salesToken}`);
    expect(res.statusCode).toBe(403);
  });

  it('TC-RBAC-04: SALES_STAFF bị chặn truy cập cài đặt hệ thống (403)', async () => {
    const res = await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${salesToken}`);
    expect(res.statusCode).toBe(403);
  });
});
