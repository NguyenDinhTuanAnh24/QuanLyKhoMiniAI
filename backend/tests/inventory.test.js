// globals injected by jest
const request = require('supertest');
const app = require('../server');
const { getTestSupabase } = require('./setup');
const bcrypt = require('bcryptjs');
const uuid = require('uuid');

const supabase = getTestSupabase();
let token;
let testUserId;
let testCategoryId;
let testUnitId;
let testSupplierId;
let testProductId;

describe('Inventory API', () => {
  beforeAll(async () => {
    // 1. Setup TEST Admin User
    testUserId = uuid.v4();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password', salt);
    await supabase.from('app_users').insert({
      user_id: testUserId,
      email: 'test_inv_admin@retail.com',
      password_hash: hashedPassword,
      full_name: 'TEST_ADMIN',
      role: 'ADMIN',
      status: 'Đang hoạt động'
    });

    const resAuth = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test_inv_admin@retail.com', password: 'password' });
    token = resAuth.body.data.token;

    // 2. Setup TEST Category, Unit, Supplier
    testCategoryId = uuid.v4();
    testUnitId = uuid.v4();
    testSupplierId = uuid.v4();

    await supabase.from('categories').insert({ category_id: testCategoryId, category_name: 'TEST_CAT' });
    await supabase.from('units').insert({ unit_id: testUnitId, unit_name: 'TEST_UNIT' });
    await supabase.from('suppliers').insert({ supplier_id: testSupplierId, supplier_name: 'TEST_SUPPLIER' });

    // 3. Setup TEST Product with 0 stock
    testProductId = uuid.v4();
    await supabase.from('products').insert({
      product_id: testProductId,
      product_name: 'TEST_PRODUCT',
      sku: 'TEST_SKU_01',
      category_id: testCategoryId,
      unit_id: testUnitId,
      supplier_id: testSupplierId,
      stock_quantity: 0,
      import_price: 100,
      selling_price: 200,
      status: 'Kinh doanh'
    });
  });

  afterAll(async () => {
    // Cleanup everything
    await supabase.from('stock_movements').delete().eq('product_id', testProductId);
    await supabase.from('import_plan_items').delete().eq('product_id', testProductId);
    // Cleanup test data
    await supabase.from('products').delete().eq('product_id', testProductId);
    await supabase.from('suppliers').delete().eq('supplier_id', testSupplierId);
    await supabase.from('units').delete().eq('unit_id', testUnitId);
    await supabase.from('categories').delete().eq('category_id', testCategoryId);
    await supabase.from('activity_logs').delete().eq('user_id', testUserId);
    await supabase.from('app_users').delete().eq('user_id', testUserId);
  });

  it('TC-INV-04: Xuất kho thất bại nếu số lượng trong kho bằng 0', async () => {
    const res = await request(app)
      .post('/api/inventory/movements')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'EXPORT',
        reason: 'TEST_EXPORT',
        note: 'Test export',
        items: [{ product_id: testProductId, quantity: 1, unit_price: 200 }]
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);

    // Verify stock remains 0
    const { data: p } = await supabase.from('products').select('stock_quantity').eq('product_id', testProductId).single();
    expect(p.stock_quantity).toBe(0);
  });

  it('TC-INV-01: Nhập kho thành công', async () => {
    const res = await request(app)
      .post('/api/inventory/movements')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'IMPORT',
        supplier_id: testSupplierId,
        date: new Date().toISOString(),
        note: 'TEST_IMPORT',
        items: [{ product_id: testProductId, quantity: 10, unit_price: 100 }]
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);

    // Verify stock is now 10
    const { data: p } = await supabase.from('products').select('stock_quantity').eq('product_id', testProductId).single();
    expect(p.stock_quantity).toBe(10);
  });

  it('TC-INV-02: Xuất kho thành công sau khi đã có tồn', async () => {
    const res = await request(app)
      .post('/api/inventory/movements')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'EXPORT',
        reason: 'TEST_EXPORT',
        note: 'Test export',
        items: [{ product_id: testProductId, quantity: 3, unit_price: 200 }]
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);

    // Verify stock is now 7
    const { data: p } = await supabase.from('products').select('stock_quantity').eq('product_id', testProductId).single();
    expect(p.stock_quantity).toBe(7);
  });
});
