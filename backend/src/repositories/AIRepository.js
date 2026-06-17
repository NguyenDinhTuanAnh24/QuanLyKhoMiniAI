const supabase = require('../config/supabase');

class AIRepository {
  async getProductsWithSuppliers() {
    // We join with suppliers to get supplier_name
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        suppliers ( supplier_name )
      `)
      .is('deleted_at', null);

    if (error) throw error;
    return data;
  }

  async getPaginatedProducts(filters, page = 1, limit = 5, onlySuggestions = false) {
    let query = supabase
      .from('products')
      .select(`
        *,
        suppliers ( supplier_name )
      `, { count: 'exact' })
      .is('deleted_at', null);

    if (filters.search) {
      query = query.or(`product_name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
    }
    
    if (filters.category) {
      query = query.eq('category_name', filters.category);
    }

    if (onlySuggestions) {
      query = query.gt('suggested_import_quantity', 0);
      // Order by suggested amount descending
      query = query.order('suggested_import_quantity', { ascending: false });
    } else {
      query = query.order('product_id', { ascending: true }); // Default ordering
    }

    // Risk level filter is hard because it's computed dynamically based on DB columns (stock vs reorder_level, forecast_14d)
    // Actually, `status` might reflect risk, but `AIService` calculates risk from stock, reorderLevel, forecast_14d.
    // If we have to filter by risk at DB level, it's tricky.
    // We will do a basic filter if `status` matches, otherwise we might just return and filter in service (but that breaks pagination).
    // Let's assume for `table`, risk filter uses the status column or we just pass it to the frontend.
    // Wait, the original code calculates risk_level. If the user filters by risk, and we only fetch 5 from DB, we can't filter AFTER DB limit.
    // For now, we will add a basic condition if possible, but the best we can do is rely on DB data.
    
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;
    return { data, count };
  }

  async getOrderItemsLast90Days() {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const dateString = ninetyDaysAgo.toISOString();

    const { data, error } = await supabase
      .from('order_items')
      .select(`
        product_id,
        quantity,
        orders!inner(created_at)
      `)
      .gte('orders.created_at', dateString);

    if (error) {
      console.warn("Could not join orders from order_items. Falling back to fetching all order_items and filtering locally if orders fetchable.");
      // Fallback if foreign key doesn't allow direct inner join on created_at
      const { data: allOrderItems, error: itemsError } = await supabase.from('order_items').select('*');
      const { data: allOrders, error: ordersError } = await supabase.from('orders').select('order_id, created_at').gte('created_at', dateString);
      
      if (itemsError || ordersError) {
        console.warn("Could not fetch order items. AI will rely on product table values.");
        return [];
      }
      
      const validOrderIds = new Set(allOrders.map(o => o.order_id));
      return allOrderItems.filter(item => validOrderIds.has(item.order_id));
    }
    
    return data;
  }
}

module.exports = new AIRepository();
