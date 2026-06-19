const supabase = require('../config/supabase');

class ReportRepository {
  /**
   * Fetch orders within a date range and optionally filter by category/supplier (which requires joining with items and products)
   * For simplicity, if categoryId or supplierId is provided, we might need a more complex query.
   * But usually, orders don't have categoryId. Let's fetch all orders in the date range.
   */
  async getOrders(startDate, endDate) {
    let query = supabase.from('orders').select('*');
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  }

  async getOrderItems(orderIds) {
    if (!orderIds || orderIds.length === 0) return [];
    
    // Split orderIds into chunks to avoid too long URL in Supabase GET request if needed
    // For small data, 'in' is fine
    const { data, error } = await supabase
      .from('order_items')
      .select('*, product:products(import_price, category_id, supplier_id, deleted_at, category:categories(category_name))')
      .in('order_id', orderIds);
      
    if (error) throw new Error(error.message);
    return data;
  }

  async getProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(category_name)')
      .is('deleted_at', null);
      
    if (error) throw new Error(error.message);
    return data;
  }

  async getStockMovements(startDate, endDate) {
    let query = supabase
      .from('stock_movements')
      .select('*, product:products(product_name, category_id, supplier_id, deleted_at, supplier:suppliers(supplier_name))');
      
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  }
}

module.exports = new ReportRepository();
