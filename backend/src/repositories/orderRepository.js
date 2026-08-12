const supabase = require('../config/supabase');

class OrderRepository {
  async getProductStock(productId) {
    const { data, error } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('product_id', productId)
      .single();
      
    if (error) {
      // Return null or throw based on preference, here we throw to catch in service
      throw error;
    }
    return data;
  }

  async insertOrder(orderData) {
    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }

  async insertOrderItems(itemsData) {
    const { data, error } = await supabase
      .from('order_items')
      .insert(itemsData)
      .select();
      
    if (error) throw error;
    return data;
  }

  async updateProductStock(productId, newStock) {
    const { error } = await supabase
      .from('products')
      .update({ stock_quantity: newStock })
      .eq('product_id', productId);
      
    if (error) throw error;
  }

  async insertStockMovements(movementsData) {
    const { data, error } = await supabase
      .from('stock_movements')
      .insert(movementsData)
      .select();
      
    if (error) throw error;
    return data;
  }

  async deleteOrderItems(orderId) {
    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId);
      
    if (error) throw error;
  }

  async deleteOrder(orderId) {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('order_id', orderId);
      
    if (error) throw error;
  }

  async getRecentOrders(limit = 10) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  async findCustomerByPhone(phone) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is the code for zero rows returned by single()
      throw error;
    }
    return data; // null if not found
  }

  async createCustomer(customerData) {
    const { data, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getOrderById(orderId) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', orderId)
      .single();
    if (error) throw error;
    return data;
  }

  async getOrderByPayosCode(payosOrderCode) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('payos_order_code', payosOrderCode)
      .single();
    if (error) throw error;
    return data;
  }

  async updateOrder(orderId, updateData) {
    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('order_id', orderId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getProductConsumption(limit = 10) {
    // Try RPC first (optimized)
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_product_consumption', { p_limit: limit });

    if (!rpcError && rpcData) {
      return rpcData;
    }

    // Fallback to JS computation if RPC is not created yet
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select('product_id, quantity, unit_price');

    if (error) throw error;

    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('product_id, product_name, sku');

    if (prodError) throw prodError;

    const productMap = {};
    products.forEach(p => {
      productMap[p.product_id] = p;
    });

    const consumptionMap = {};
    orderItems.forEach(item => {
      const pid = item.product_id;
      const product = productMap[pid] || {};
      if (!consumptionMap[pid]) {
        consumptionMap[pid] = {
          product_id: pid,
          product_name: product.product_name || pid,
          sku: product.sku || '',
          quantity_sold: 0,
          total_revenue: 0
        };
      }
      consumptionMap[pid].quantity_sold += Number(item.quantity || 0);
      consumptionMap[pid].total_revenue += Number(item.quantity || 0) * Number(item.unit_price || 0);
    });

    const result = Object.values(consumptionMap)
      .sort((a, b) => b.quantity_sold - a.quantity_sold)
      .slice(0, limit);

    return result;
  }

  // Scan for orphan data across orders, order_items, stock_movements, and products
  async scanDataIntegrity() {
    // Orphan order_items (order_id not existing in orders)
    const { data: items, error: errItems } = await supabase
      .from('order_items')
      .select('order_item_id, order_id');
    if (errItems) throw errItems;

    const { data: orders, error: errOrders } = await supabase
      .from('orders')
      .select('order_id');
    if (errOrders) throw errOrders;

    const orderIdSet = new Set((orders || []).map(o => o.order_id));
    const orphanOrderItems = (items || []).filter(i => !orderIdSet.has(i.order_id));

    // Orphan stock_movements (product_id not existing in products)
    const { data: movements, error: errMov } = await supabase
      .from('stock_movements')
      .select('movement_id, product_id');
    if (errMov) throw errMov;

    const { data: products, error: errProd } = await supabase
      .from('products')
      .select('product_id');
    if (errProd) throw errProd;

    const productIdSet = new Set((products || []).map(p => p.product_id));
    const orphanStockMovements = (movements || []).filter(m => !productIdSet.has(m.product_id));

    // Orphan products (no related order_items nor stock_movements)
    const productHasOrders = new Set((items || []).map(i => i.product_id));
    const productHasMovements = new Set((movements || []).map(m => m.product_id));
    const orphanProducts = (products || []).filter(p => !productHasOrders.has(p.product_id) && !productHasMovements.has(p.product_id));

    return { orphanOrderItems, orphanStockMovements, orphanProducts };
  }

}

module.exports = new OrderRepository();
