const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

class AIRepository {
  async getForecastBaseData() {
    // 1. Lấy danh sách sản phẩm active kèm thông tin danh mục, ncc, đvt
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select(`
        product_id,
        sku,
        product_name,
        supplier_id,
        stock_quantity,
        reorder_level,
        import_price,
        selling_price,
        category:categories(category_name),
        supplier:suppliers(supplier_name),
        unit:units(unit_name)
      `)
      .is('deleted_at', null);

    if (prodErr) throw new Error(`Error fetching products: ${prodErr.message}`);

    // 2. Lấy đơn hàng trong 90 ngày gần nhất
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString();

    const { data: orders, error: orderErr } = await supabase
      .from('orders')
      .select(`
        order_id,
        created_at,
        order_items (
          product_id,
          quantity
        )
      `)
      .gte('created_at', ninetyDaysAgoStr);
      // Giả định order thành công vì schema không có status cho order. Nếu có sẽ filter eq('status', 'COMPLETED')

    if (orderErr) throw new Error(`Error fetching orders: ${orderErr.message}`);

    // 3. (Optional) Lấy stock movements để phân tích nhập/xuất thêm nếu cần
    // Tạm thời bỏ qua nếu chưa cần tính chi tiết movement, tập trung vào sales_90d từ order_items
    
    // Map data
    const productMap = {};
    products.forEach(p => {
      productMap[p.product_id] = {
        ...p,
        supplier_id: p.supplier_id || null,
        category_name: p.category?.category_name || null,
        supplier_name: p.supplier?.supplier_name || null,
        unit_name: p.unit?.unit_name || null,
        sales_7d: 0,
        sales_30d: 0,
        sales_90d: 0,
        last_sale_date: null
      };
      delete productMap[p.product_id].category;
      delete productMap[p.product_id].supplier;
      delete productMap[p.product_id].unit;
    });

    const now = new Date();
    orders.forEach(order => {
      const orderDate = new Date(order.created_at);
      const diffTime = Math.abs(now - orderDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

      order.order_items.forEach(item => {
        if (productMap[item.product_id]) {
          productMap[item.product_id].sales_90d += item.quantity;
          if (diffDays <= 30) {
            productMap[item.product_id].sales_30d += item.quantity;
          }
          if (diffDays <= 7) {
            productMap[item.product_id].sales_7d += item.quantity;
          }
          if (!productMap[item.product_id].last_sale_date || new Date(productMap[item.product_id].last_sale_date) < orderDate) {
            productMap[item.product_id].last_sale_date = order.created_at;
          }
        }
      });
    });

    return Object.values(productMap);
  }

  async createAnalysisRun(runData) {
    const { data, error } = await supabase
      .from('ai_analysis_runs')
      .insert([runData])
      .select()
      .single();
    if (error) throw new Error(`Error creating run: ${error.message}`);
    return data;
  }

  async updateAnalysisProgress(runId, progressData) {
    const { error } = await supabase
      .from('ai_analysis_runs')
      .update(progressData)
      .eq('run_id', runId);
    if (error) console.error(`Error updating progress for run ${runId}: ${error.message}`);
  }

  async saveAnalysisRun(runData, recommendations) {
    // Luu bang ai_analysis_runs
    const { data: run, error: runErr } = await supabase
      .from('ai_analysis_runs')
      .upsert([runData], { onConflict: 'run_id' })
      .select()
      .single();

    if (runErr) throw new Error(`Error saving run: ${runErr.message}`);

    // Luu bang ai_recommendations
    if (recommendations && recommendations.length > 0) {
      const crypto = require('crypto');
      const recsToInsert = recommendations.map(rec => ({
        ...rec,
        run_id: runData.run_id,
        recommendation_id: rec.recommendation_id || crypto.randomUUID()
      }));

      const { error: recErr } = await supabase
        .from('ai_recommendations')
        .insert(recsToInsert);
      
      if (recErr) throw new Error(`Error saving recommendations: ${recErr.message}`);
    }

    return run;
  }

  async getLatestRecommendations() {
    // Lấy run mới nhất
    const { data: latestRun, error: runErr } = await supabase
      .from('ai_analysis_runs')
      .select('*')
      .eq('status', 'COMPLETED')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (runErr && runErr.code !== 'PGRST116') throw new Error(`Error fetching latest run: ${runErr.message}`);
    if (!latestRun) return null;

    // Lấy recommendations của run đó
    const { data: recommendations, error: recErr } = await supabase
      .from('ai_recommendations')
      .select('*')
      .eq('run_id', latestRun.run_id)
      .order('suggested_import_quantity', { ascending: false });
    
    if (recErr) throw new Error(`Error fetching recommendations: ${recErr.message}`);

    return { run: latestRun, recommendations };
  }

  async updateRecommendationStatus(id, status) {
    const { data, error } = await supabase
      .from('ai_recommendations')
      .update({ status })
      .eq('recommendation_id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async checkActivePlanForProduct(productId) {
    const { data, error } = await supabase
      .from('import_plan_items')
      .select(`
        plan_id,
        import_plans!inner(status)
      `)
      .eq('product_id', productId)
      .in('import_plans.status', ['DRAFT', 'PENDING'])
      .limit(1)
      .maybeSingle();
      
    if (error) throw new Error(error.message);
    return data ? data.plan_id : null;
  }

  async applyRecommendation(recommendationId, userId) {
    // 1. Fetch product to get supplier_id
    const { data: rec, error: getErr } = await supabase
      .from('ai_recommendations')
      .select('*, products(supplier_id)')
      .eq('recommendation_id', recommendationId)
      .single();
      
    if (getErr) throw new Error('Không tìm thấy gợi ý.');

    // Check if active plan exists
    const activePlanId = await this.checkActivePlanForProduct(rec.product_id);
    if (activePlanId) {
      throw new Error(`Đã có kế hoạch nhập đang chờ cho sản phẩm này (Phiếu: ${activePlanId}).`);
    }

    // 2. Atomic update to claim the recommendation
    const { data: updatedRec, error: updateErr } = await supabase
      .from('ai_recommendations')
      .update({ 
        status: 'APPLIED', 
        applied_by: userId,
        applied_at: new Date().toISOString()
      })
      .eq('recommendation_id', recommendationId)
      .eq('status', 'PENDING')
      .eq('action_type', 'REORDER_STOCK')
      .select()
      .single();
      
    if (updateErr) {
      if (updateErr.code === 'PGRST116') {
        throw new Error('Gợi ý này đã được xử lý hoặc không hợp lệ.');
      }
      throw new Error(`Error updating recommendation: ${updateErr.message}`);
    }

    // 3. Create Import Plan
    const planId = uuidv4();
    const { error: planErr } = await supabase
      .from('import_plans')
      .insert({
        id: planId,
        status: 'DRAFT',
        source: 'AI',
        source_run_id: updatedRec.run_id,
        created_by: userId
      });
      
    if (planErr) throw new Error(`Error creating import plan: ${planErr.message}`);

    // 4. Create Import Plan Item
    const itemId = uuidv4();
    const supplierId = rec.products?.supplier_id || null;
    const { error: itemErr } = await supabase
      .from('import_plan_items')
      .insert({
        id: itemId,
        plan_id: planId,
        product_id: updatedRec.product_id,
        supplier_id: supplierId,
        suggested_quantity: updatedRec.suggested_import_quantity,
        actual_quantity: updatedRec.suggested_import_quantity,
        ai_recommendation_id: updatedRec.recommendation_id
      });
      
    if (itemErr) throw new Error(`Error creating import plan item: ${itemErr.message}`);

    // Update recommendation with application info
    await supabase
      .from('ai_recommendations')
      .update({ 
        application_type: 'IMPORT_PLAN',
        application_id: planId
      })
      .eq('recommendation_id', recommendationId);

    return planId;
  }

  async applyBulkRecommendations(analysis_run_id, userId) {
    if (!analysis_run_id) {
      throw new Error('Thiếu mã phiên phân tích để tạo kế hoạch.');
    }

    // 1. Fetch pending recommendations
    const { data: recs, error: fetchErr } = await supabase
      .from('ai_recommendations')
      .select('*, products(supplier_id)')
      .eq('run_id', analysis_run_id)
      .eq('status', 'PENDING')
      .eq('action_type', 'REORDER_STOCK')
      .gt('suggested_import_quantity', 0);
      
    if (fetchErr) throw new Error(fetchErr.message);
    if (!recs || recs.length === 0) throw new Error('Không có gợi ý nào hợp lệ hoặc đã được xử lý.');

    const planId = uuidv4();
    const planItems = [];
    const recIds = [];

    recs.forEach(rec => {
      recIds.push(rec.recommendation_id);
      planItems.push({
        id: uuidv4(),
        plan_id: planId,
        product_id: rec.product_id,
        supplier_id: rec.products?.supplier_id || null,
        suggested_quantity: rec.suggested_import_quantity,
        actual_quantity: rec.suggested_import_quantity,
        ai_recommendation_id: rec.recommendation_id
      });
    });

    // 1. Create plan FIRST
    const { error: planErr } = await supabase
      .from('import_plans')
      .insert({
        id: planId,
        status: 'DRAFT',
        source: 'AI',
        source_run_id: analysis_run_id,
        created_by: userId
      });
    if (planErr) throw new Error(planErr.message);

    // 2. Create items
    const { error: itemsErr } = await supabase
      .from('import_plan_items')
      .insert(planItems);
    if (itemsErr) {
      // Rollback attempt (best effort)
      await supabase.from('import_plans').delete().eq('id', planId);
      throw new Error(itemsErr.message);
    }

    // 3. Update recommendations to APPLIED LAST
    const { data: updatedRecs, error: updateErr } = await supabase
      .from('ai_recommendations')
      .update({ 
        status: 'APPLIED', 
        applied_by: userId,
        applied_at: new Date().toISOString(),
        application_type: 'IMPORT_PLAN',
        application_id: planId
      })
      .in('recommendation_id', recIds)
      .eq('status', 'PENDING')
      .select();
      
    if (updateErr) {
      console.error('Lỗi khi cập nhật recommendations:', updateErr);
      // Even if this fails, the plan was created, which is better than having an invalid planId
    }

    return { planId, count: planItems.length };
  }
}

module.exports = new AIRepository();
