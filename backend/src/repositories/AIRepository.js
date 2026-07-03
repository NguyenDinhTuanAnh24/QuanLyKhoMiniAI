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
