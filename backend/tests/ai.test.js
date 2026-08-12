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
let testProductIds = [];
let testRunId;
let testRecommendationIds = [];

describe('AI Insight API', () => {
  beforeAll(async () => {
    testUserId = uuid.v4();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password', salt);
    await supabase.from('app_users').insert({
      user_id: testUserId,
      email: 'test_ai_admin@retail.com',
      password_hash: hashedPassword,
      full_name: 'TEST_ADMIN',
      role: 'ADMIN',
      status: 'Đang hoạt động'
    });

    const resAuth = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test_ai_admin@retail.com', password: 'password' });
    token = resAuth.body.data.token;

    testCategoryId = uuid.v4();
    testUnitId = uuid.v4();
    testSupplierId = uuid.v4();

    await supabase.from('categories').insert({ category_id: testCategoryId, category_name: 'TEST_CAT_AI' });
    await supabase.from('units').insert({ unit_id: testUnitId, unit_name: 'TEST_UNIT_AI' });
    await supabase.from('suppliers').insert({ supplier_id: testSupplierId, supplier_name: 'TEST_SUP_AI' });

    testRunId = uuid.v4();
    await supabase.from('ai_analysis_runs').insert({
      run_id: testRunId,
      status: 'COMPLETED',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    });

    for (let i = 0; i < 3; i++) {
      const pid = uuid.v4();
      testProductIds.push(pid);
      await supabase.from('products').insert({
        product_id: pid,
        product_name: `TEST_PRODUCT_AI_${i}`,
        sku: `TEST_SKU_A${i}`,
        category_id: testCategoryId,
        unit_id: testUnitId,
        supplier_id: testSupplierId,
        stock_quantity: 5,
        reorder_level: 20,
        reorder_quantity: 50,
        import_price: 100,
        selling_price: 200,
        status: 'Kinh doanh'
      });

      const rid = uuid.v4();
      testRecommendationIds.push(rid);
      await supabase.from('ai_recommendations').insert({
        recommendation_id: rid,
        run_id: testRunId,
        product_id: pid,
        priority: 'HIGH',
        suggested_import_quantity: 50,
        reason: 'Low stock test',
        status: 'PENDING'
      });
    }
  });

  afterAll(async () => {
    // Cleanup
    await supabase.from('import_plan_items').delete().in('product_id', testProductIds);
    const { data: plans } = await supabase.from('import_plans').select('plan_id').eq('notes', 'Tạo tự động từ kết quả phân tích AI');
    if (plans && plans.length > 0) {
      await supabase.from('import_plans').delete().in('plan_id', plans.map(p => p.plan_id));
    }
    
    await supabase.from('ai_recommendations').delete().in('recommendation_id', testRecommendationIds);
    await supabase.from('ai_analysis_runs').delete().eq('run_id', testRunId);

    await supabase.from('products').delete().in('product_id', testProductIds);
    await supabase.from('suppliers').delete().eq('supplier_id', testSupplierId);
    await supabase.from('units').delete().eq('unit_id', testUnitId);
    await supabase.from('categories').delete().eq('category_id', testCategoryId);
    await supabase.from('activity_logs').delete().eq('user_id', testUserId);
    await supabase.from('app_users').delete().eq('user_id', testUserId);
  });

  it('TC-AI-14: Fetch latest analysis thành công', async () => {
    const res = await request(app)
      .get(`/api/ai/analysis-runs/${testRunId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('TC-AIP-01: Tạo kế hoạch nhập hàng loạt (Bulk Apply)', async () => {
    const res = await request(app)
      .post('/api/ai/recommendations/apply-bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({
        analysis_run_id: testRunId,
        recommendation_ids: [] // empty will apply all pending
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.count).toBe(3);
    
    // Check recommendation status
    const { data: recs } = await supabase.from('ai_recommendations').select('status, application_id').in('recommendation_id', testRecommendationIds);
    expect(recs.length).toBe(3);
    recs.forEach(rec => {
      expect(rec.status).toBe('APPLIED');
    });

    // Check products stock remains unchanged (Bulk apply only creates draft plan)
    const { data: products } = await supabase.from('products').select('stock_quantity').in('product_id', testProductIds);
    products.forEach(p => {
      expect(p.stock_quantity).toBe(5);
    });
  });

  it('TC-AIP-02: Duplicate Bulk Apply returns error', async () => {
    // Calling bulk apply again should return 400 because no PENDING recommendations left
    const res = await request(app)
      .post('/api/ai/recommendations/apply-bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({
        analysis_run_id: testRunId,
        recommendation_ids: []
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Không có gợi ý');
  });
});
