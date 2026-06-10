const orderRepository = require('../repositories/orderRepository');

class OrderService {
  async getRecentOrders(limit = 10) {
    return await orderRepository.getRecentOrders(limit);
  }

  async getProductConsumption(limit = 10) {
    return await orderRepository.getProductConsumption(limit);
  }

  async createOrder(data) {
    // 1. Check stock for all items first
    for (const item of data.items) {
      let product;
      try {
        product = await orderRepository.getProductStock(item.product_id);
      } catch (err) {
        const error = new Error(`Product not found: ${item.product_id}`);
        error.statusCode = 404;
        throw error;
      }
      
      if (!product) {
        const err = new Error(`Product not found: ${item.product_id}`);
        err.statusCode = 404;
        throw err;
      }
      
      if (product.stock_quantity < item.quantity) {
        const err = new Error(`INSUFFICIENT_STOCK: Không đủ tồn kho cho sản phẩm ${item.product_id} (Hiện còn: ${product.stock_quantity})`);
        err.statusCode = 400;
        throw err;
      }
    }

    // Generate order_code and IDs
    const timestampStr = Date.now().toString().slice(-6);
    const order_code = data.order_code || `ORD${timestampStr}${Math.floor(Math.random() * 100)}`;
    const order_id = order_code;

    // 2. Handle Customer (Find or Create)
    let customer_id = null;
    if (data.customer_phone) {
      let customer = await orderRepository.findCustomerByPhone(data.customer_phone);
      if (!customer) {
        const newCustomerId = `CUST${timestampStr}${Math.floor(Math.random() * 100)}`;
        customer = await orderRepository.createCustomer({
          customer_id: newCustomerId,
          customer_name: data.customer_name || 'Khách lẻ',
          phone: data.customer_phone
        });
      }
      customer_id = customer.customer_id;
    }
    
    // 3. Insert Order
    const orderDataToInsert = {
      order_id,
      order_code,
      customer_name: data.customer_name || 'Khách lẻ',
      customer_id: customer_id,
      payment_method: data.payment_method, // Lấy nguyên gốc từ payload gửi lên (Tiền mặt, Chuyển khoản, Thẻ)
      total_amount: data.total_amount,
      created_by: 'Nhân viên bán hàng'
    };

    let order;
    try {
      order = await orderRepository.insertOrder(orderDataToInsert);
    } catch (orderError) {
      throw orderError;
    }

    const orderId = order.order_id || order_id; // Use generated or returned
    let itemsInserted = false;
    let stockUpdated = false;

    try {
      // 3. Insert Order Items
      const orderItemsToInsert = data.items.map((item, index) => ({
        order_item_id: `ITEM${timestampStr}${Math.floor(Math.random() * 100)}${index}`,
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.quantity * item.unit_price
      }));

      await orderRepository.insertOrderItems(orderItemsToInsert);
      itemsInserted = true;

      // 4. Update Stock Quantities
      for (const item of data.items) {
        const p = await orderRepository.getProductStock(item.product_id);
        await orderRepository.updateProductStock(item.product_id, p.stock_quantity - item.quantity);
      }
      stockUpdated = true;

      // 5. Insert Stock Movements
      const movementsToInsert = [];
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        const p = await orderRepository.getProductStock(item.product_id);
        movementsToInsert.push({
          movement_id: `MOV${timestampStr}${Math.floor(Math.random() * 100)}${i}`,
          product_id: item.product_id,
          type: 'SALE',
          quantity: item.quantity,
          old_quantity: p.stock_quantity + item.quantity, // Since we already subtracted it
          new_quantity: p.stock_quantity,
          unit_price: item.unit_price,
          note: `Xuất kho bán hàng ${order_code}`
        });
      }

      await orderRepository.insertStockMovements(movementsToInsert);

      return order;
    } catch (err) {
      // Manual Rollback using Repository methods
      if (stockUpdated) {
        for (const item of data.items) {
          try {
            const p = await orderRepository.getProductStock(item.product_id);
            if (p) {
              await orderRepository.updateProductStock(item.product_id, p.stock_quantity + item.quantity);
            }
          } catch (rollbackErr) {
            console.error('Failed to rollback stock for product', item.product_id, rollbackErr);
          }
        }
      }
      if (itemsInserted) {
         try {
           await orderRepository.deleteOrderItems(orderId);
         } catch (rollbackErr) {
           console.error('Failed to rollback order items', orderId, rollbackErr);
         }
      }
      try {
        await orderRepository.deleteOrder(orderId);
      } catch (rollbackErr) {
        console.error('Failed to rollback order', orderId, rollbackErr);
      }
      
      throw err;
    }
  }
}

module.exports = new OrderService();
