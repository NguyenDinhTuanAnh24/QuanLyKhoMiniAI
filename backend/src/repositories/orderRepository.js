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
}

module.exports = new OrderRepository();
