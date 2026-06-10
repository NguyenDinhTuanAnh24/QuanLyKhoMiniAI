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

  async getProductConsumption(limit = 10) {
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
}

module.exports = new OrderRepository();
