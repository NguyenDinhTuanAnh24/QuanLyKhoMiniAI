const supabase = require('../config/supabase');

class DashboardRepository {
  async getDashboardData(role) {
    const isStaff = role === 'WAREHOUSE_STAFF' || role === 'SALES_STAFF';
    // 1. Get products for summary (total, stock, value, low_stock)
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('product_id, product_name, sku, stock_quantity, reorder_level, reorder_quantity, import_price, unit:units(unit_name)')
      .is('deleted_at', null);
      
    if (productError) throw new Error(productError.message);

    let total_products = 0;
    let total_stock = 0;
    let inventory_value = 0;
    let low_stock_products_all = [];

    if (products) {
      total_products = products.length;
      products.forEach(p => {
        total_stock += p.stock_quantity || 0;
        inventory_value += (p.stock_quantity || 0) * (p.import_price || 0);
        
        if (p.stock_quantity <= p.reorder_level) {
          low_stock_products_all.push({
            ...p,
            unit_name: p.unit ? p.unit.unit_name : '',
            status: p.stock_quantity <= 0 ? 'Hết hàng' : 'Cần nhập'
          });
        }
      });
    }

    const low_stock_count = low_stock_products_all.length;
    // Sort and get top 5 low stock (e.g. by lowest stock relative to reorder level)
    low_stock_products_all.sort((a, b) => a.stock_quantity - b.stock_quantity);
    const low_stock_products = low_stock_products_all.slice(0, 5);

    // 2. Get orders for today and 7 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('order_id, created_at, total_amount')
      .gte('created_at', sevenDaysAgo.toISOString());

    if (orderError) throw new Error(orderError.message);

    let today_revenue = 0;
    let today_orders = 0;
    
    // Helper to get local date string YYYY-MM-DD
    const getLocalDateString = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // For 7 days chart
    const revenue_7_days_map = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = getLocalDateString(d);
      const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      const label = days[d.getDay()];
      revenue_7_days_map[dateStr] = { date: dateStr, label, revenue: 0, orders: 0 };
    }

    if (orders) {
      orders.forEach(o => {
        const orderDate = new Date(o.created_at);
        if (orderDate >= today) {
          today_revenue += parseFloat(o.total_amount || 0);
          today_orders += 1;
        }
        
        const dateStr = getLocalDateString(orderDate);
        if (revenue_7_days_map[dateStr]) {
          revenue_7_days_map[dateStr].revenue += parseFloat(o.total_amount || 0);
          revenue_7_days_map[dateStr].orders += 1;
        }
      });
    }

    const revenue_7_days = Object.values(revenue_7_days_map).sort((a, b) => a.date.localeCompare(b.date));

    // 3. Get top selling products (using all order_items for now or could limit to 30 days)
    // To avoid complex joins, fetch order items with product and category info
    const { data: orderItems, error: oiError } = await supabase
      .from('order_items')
      .select('product_id, quantity, unit_price, products(product_name, category:categories(category_name))');

    if (oiError) throw new Error(oiError.message);

    const productSalesMap = {};
    if (orderItems) {
      orderItems.forEach(item => {
        if (!item.products) return; // skip if product deleted/missing
        
        const pid = item.product_id;
        if (!productSalesMap[pid]) {
          productSalesMap[pid] = {
            product_id: pid,
            product_name: item.products.product_name,
            category_name: item.products.category ? item.products.category.category_name : '',
            quantity_sold: 0,
            revenue: 0
          };
        }
        productSalesMap[pid].quantity_sold += item.quantity;
        productSalesMap[pid].revenue += (item.quantity * item.unit_price);
      });
    }

    const top_selling = Object.values(productSalesMap)
      .sort((a, b) => b.quantity_sold - a.quantity_sold)
      .slice(0, 5);

    // 4. Get recent activities (combine orders and stock movements)
    const { data: recentOrders, error: roError } = await supabase
      .from('orders')
      .select('order_id, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: recentMovements, error: rmError } = await supabase
      .from('stock_movements')
      .select('movement_id, movement_type, quantity, created_at, products(product_name)')
      .order('created_at', { ascending: false })
      .limit(5);

    let recent_activities = [];
    
    if (recentOrders) {
      recentOrders.forEach(o => {
        recent_activities.push({
          id: o.order_id,
          type: 'ORDER',
          title: 'Tạo đơn hàng',
          description: `Đơn hàng ${o.order_id} đã được tạo`,
          created_at: o.created_at
        });
      });
    }

    if (recentMovements) {
      recentMovements.forEach(m => {
        const pName = m.products ? m.products.product_name : 'Sản phẩm';
        const isImport = m.movement_type === 'IMPORT' || m.movement_type === 'IN';
        recent_activities.push({
          id: m.movement_id,
          type: 'STOCK',
          title: isImport ? 'Nhập kho' : 'Xuất kho',
          description: `${isImport ? 'Nhập kho' : 'Xuất kho'} ${pName} ${isImport ? '+' : '-'}${m.quantity}`,
          created_at: m.created_at
        });
      });
    }

    recent_activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    recent_activities = recent_activities.slice(0, 5);

    return {
      summary: {
        total_products,
        total_stock,
        today_revenue: isStaff ? 0 : today_revenue,
        low_stock_count,
        today_orders,
        inventory_value: isStaff ? 0 : inventory_value
      },
      revenue_7_days: isStaff ? [] : revenue_7_days,
      top_selling: isStaff ? [] : top_selling,
      low_stock_products,
      ai_insight: {
        message: `AI phát hiện ${low_stock_count} sản phẩm có nguy cơ thiếu hàng. Nên ưu tiên nhập bổ sung các sản phẩm tồn kho thấp.`,
        suggestions: low_stock_products.slice(0, 3).map(p => ({
          product_id: p.product_id,
          product_name: p.product_name,
          suggested_import_quantity: p.reorder_quantity || 0,
          unit_name: p.unit_name
        }))
      },
      recent_activities
    };
  }
}

module.exports = new DashboardRepository();
