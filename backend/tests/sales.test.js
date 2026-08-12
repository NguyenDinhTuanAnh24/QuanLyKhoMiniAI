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

describe('Sales API', () => {
  beforeAll(async () => {
    testUserId = uuid.v4();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password', salt);
    await supabase.from('app_users').insert({
      user_id: testUserId,
      email: 'test_sales_admin@retail.com',
      password_hash: hashedPassword,
      full_name: 'TEST_ADMIN',
      role: 'ADMIN',
      status: 'Đang hoạt động'
    });

    const resAuth = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test_sales_admin@retail.com', password: 'password' });
    token = resAuth.body.data.token;

    testCategoryId = uuid.v4();
    testUnitId = uuid.v4();
    testSupplierId = uuid.v4();

    await supabase.from('categories').insert({ category_id: testCategoryId, category_name: 'TEST_CAT_SALES' });
    await supabase.from('units').insert({ unit_id: testUnitId, unit_name: 'TEST_UNIT_SALES' });
    await supabase.from('suppliers').insert({ supplier_id: testSupplierId, supplier_name: 'TEST_SUP_SALES' });

    testProductId = uuid.v4();
    await supabase.from('products').insert({
      product_id: testProductId,
      product_name: 'TEST_PRODUCT_SALES',
      sku: 'TEST_SKU_S1',
      category_id: testCategoryId,
      unit_id: testUnitId,
      supplier_id: testSupplierId,
      stock_quantity: 10,
      import_price: 100,
      selling_price: 200,
      status: 'Kinh doanh'
    });
  });

  afterAll(async () => {
    await supabase.from('stock_movements').delete().eq('product_id', testProductId);
    await supabase.from('order_items').delete().eq('product_id', testProductId);
    
    // We can't delete orders directly without knowing their IDs, but we can query them by user_id
    const { data: orders } = await supabase.from('orders').select('order_id').eq('user_id', testUserId);
    if (orders && orders.length > 0) {
      await supabase.from('orders').delete().in('order_id', orders.map(o => o.order_id));
    }

    await supabase.from('products').delete().eq('product_id', testProductId);
    await supabase.from('suppliers').delete().eq('supplier_id', testSupplierId);
    await supabase.from('units').delete().eq('unit_id', testUnitId);
    await supabase.from('categories').delete().eq('category_id', testCategoryId);
    await supabase.from('activity_logs').delete().eq('user_id', testUserId);
    await supabase.from('app_users').delete().eq('user_id', testUserId);
  });

  it('TC-SALE-01: Bán hàng hợp lệ tự động trừ tồn kho', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customer_name: 'TEST CUSTOMER',
        total_amount: 400,
        amount_paid: 400,
        payment_method: 'Tiền mặt',
        items: [{ product_id: testProductId, quantity: 2, unit_price: 200, subtotal: 400 }]
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);

    const { data: p } = await supabase.from('products').select('stock_quantity').eq('product_id', testProductId).single();
    expect(p.stock_quantity).toBe(8);
  });

  it('TC-SALE-03: Rollback toàn bộ Order khi có sản phẩm không đủ Stock', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customer_name: 'TEST CUSTOMER',
        total_amount: 2000,
        amount_paid: 2000,
        payment_method: 'Tiền mặt',
        items: [{ product_id: testProductId, quantity: 20, unit_price: 200, subtotal: 4000 }] // Require 20, have 8
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);

    // Stock should not be modified
    const { data: p } = await supabase.from('products').select('stock_quantity').eq('product_id', testProductId).single();
    expect(p.stock_quantity).toBe(8);
  });
});
