// globals injected by jest
const request = require('supertest');
const app = require('../server');
const { getTestSupabase } = require('./setup');
const bcrypt = require('bcryptjs');
const uuid = require('uuid');

const supabase = getTestSupabase();
const TEST_EMAIL = 'test_admin_auth@retail.com';
const TEST_PASSWORD = 'password123';
let testUserId;

describe('Auth API (POST /api/auth/login)', () => {
  beforeAll(async () => {
    // Create a TEST_ADMIN user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, salt);
    testUserId = uuid.v4();

    const { error } = await supabase.from('app_users').insert({
      user_id: testUserId,
      email: TEST_EMAIL,
      password_hash: hashedPassword,
      full_name: 'TEST_ADMIN',
      role: 'ADMIN',
      status: 'Đang hoạt động'
    });
    
    if (error) console.error('Setup error:', error);
  });

  afterAll(async () => {
    // Cleanup TEST_ADMIN user
    await supabase.from('activity_logs').delete().eq('user_id', testUserId);
    await supabase.from('app_users').delete().eq('user_id', testUserId);
  });

  it('TC-AUTH-01: Đăng nhập thành công với thông tin đúng', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user).toHaveProperty('email', TEST_EMAIL);
    expect(res.body.data.user.role).toBe('ADMIN');
  });

  it('TC-AUTH-02: Sai password trả về 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: 'wrongpassword' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('TC-AUTH-03: Email không tồn tại trả về 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not_exist@retail.com', password: TEST_PASSWORD });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('TC-AUTH-05: Request body thiếu/sai định dạng trả về 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'invalid-email' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
