const supabase = require('../config/supabase');

class AIRepository {
  async getForecastBaseData() {
    // 1. Lấy danh sách sản phẩm active kèm thông tin danh mục, ncc, đvt
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select(`
        product_id,
        sku,
        product_name,
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

  async saveAnalysisRun(runData, recommendations) {
    // Luu bang ai_analysis_runs
    const { data: run, error: runErr } = await supabase
      .from('ai_analysis_runs')
      .insert([runData])
      .select()
      .single();

    if (runErr) throw new Error(`Error saving run: ${runErr.message}`);

    // Luu bang ai_recommendations
    if (recommendations && recommendations.length > 0) {
      const { error: recErr } = await supabase
        .from('ai_recommendations')
        .insert(recommendations);
      
      if (recErr) throw new Error(`Error saving recommendations: ${recErr.message}`);
    }

    return run;
  }

  async getLatestRecommendations() {
    // Lấy run mới nhất
    const { data: latestRun, error: runErr } = await supabase
      .from('ai_analysis_runs')
      .select('*')
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
}

module.exports = new AIRepository();
