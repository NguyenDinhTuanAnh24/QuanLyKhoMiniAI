const orderRepository = require('../repositories/orderRepository');
const notificationService = require('./NotificationService');


class OrderService {
  async getRecentOrders(limit = 10) {
    return await orderRepository.getRecentOrders(limit);
  }

  async getOrderPaymentStatus(orderId) {
    const order = await orderRepository.getOrderById(orderId);
    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      throw error;
    }
    return {
      order_id: order.order_id,
      order_code: order.order_code,
      payment_status: order.payment_status || 'UNPAID'
    };
  }

  async getProductConsumption(limit = 10) {
    return await orderRepository.getProductConsumption(limit);
  }

  async createOrder(data, user) {
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
    const order_code = data.order_code || `DH${timestampStr}${Math.floor(Math.random() * 100)}`;
    const order_id = order_code;
    const payos_order_code = parseInt(`${timestampStr}${Math.floor(Math.random() * 9000) + 1000}`, 10);

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

    const isBankTransfer = data.payment_method === 'Chuyển khoản';
    
    // 3. Insert Order
    const orderDataToInsert = {
      order_id,
      order_code,
      customer_name: data.customer_name || 'Khách lẻ',
      customer_phone: data.customer_phone || null,
      customer_id: customer_id,
      payment_method: data.payment_method,
      total_amount: data.total_amount,
      created_by: user ? user.full_name : 'Nhân viên bán hàng',
      payment_status: isBankTransfer ? 'PENDING_PAYMENT' : 'PAID',
      payos_order_code: isBankTransfer ? payos_order_code : null
    };

    let order;
    try {
      order = await orderRepository.insertOrder(orderDataToInsert);
    } catch (orderError) {
      throw orderError;
    }

    const orderId = order.order_id || order_id;
    let itemsInserted = false;

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

      // Only deduct stock immediately for non-bank transfer (Cash)
      if (!isBankTransfer) {
        await this.deductStockAndRecordMovements(order, data.items);
      }

      if (!isBankTransfer) {
        try {
          const creatorName = user ? user.full_name : 'Nhân viên bán hàng';
          await notificationService.createNotification({
            title: `Tạo đơn hàng mới #${order.order_code}`,
            message: `Đơn hàng #${order.order_code} trị giá ${data.total_amount?.toLocaleString('vi-VN')}đ đã được tạo và thanh toán bằng tiền mặt bởi ${creatorName}.`,
            type: 'ORDER_NEW',
            related_link: '/sales',
            targetRoles: ['Quản trị viên', 'Chủ cửa hàng'],
            user_id: user?.user_id
          });
        } catch (notiErr) {
          console.error('Failed to create ORDER_NEW notification:', notiErr);
        }
      }

      return {
        order,
        items: orderItemsToInsert
      };
    } catch (err) {
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

  async deductStockAndRecordMovements(order, items) {
    const timestampStr = Date.now().toString().slice(-6);
    
    // First, cache current stock
    const originalStocks = {};
    for (const item of items) {
      const p = await orderRepository.getProductStock(item.product_id);
      originalStocks[item.product_id] = p.stock_quantity;
    }

    // Update Stock Quantities
    for (const item of items) {
      await orderRepository.updateProductStock(item.product_id, originalStocks[item.product_id] - item.quantity);
    }

    // Insert Stock Movements
    const movementsToInsert = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const oldQty = originalStocks[item.product_id];
      movementsToInsert.push({
        movement_id: `MOV${timestampStr}${Math.floor(Math.random() * 100)}${i}`,
        product_id: item.product_id,
        type: 'SALE',
        quantity: item.quantity,
        old_quantity: oldQty,
        new_quantity: oldQty - item.quantity,
        unit_price: item.unit_price,
        note: `Xuất kho bán hàng ${order.order_code}`
      });
    }

    await orderRepository.insertStockMovements(movementsToInsert);

    // Check Low Stock Alerts
    for (const item of items) {
      try {
        const pData = await orderRepository.getProductStock(item.product_id);
        if (pData && pData.stock_quantity <= pData.reorder_level) {
          await notificationService.checkAndCreateLowStockAlert(
            item.product_id, 
            pData.product_name || item.product_id, 
            pData.stock_quantity, 
            pData.reorder_level
          );
        }
      } catch (lowErr) {
        console.error('Failed to check low stock alert in OrderService:', lowErr);
      }
    }
  }

  async processSuccessfulPayment(payosOrderCode) {
    const order = await orderRepository.getOrderByPayosCode(payosOrderCode);
    if (!order) return null;

    if (order.payment_status === 'PAID') {
      return order; // Already processed
    }

    if (order.payment_status === 'PENDING_PAYMENT') {
      // Update order status
      const updatedOrder = await orderRepository.updateOrder(order.order_id, {
        payment_status: 'PAID',
        paid_at: new Date().toISOString()
      });

      // Deduct stock
      try {
        await this.deductStockAndRecordMovements(updatedOrder, order.order_items);
      } catch (err) {
        console.error(`Failed to deduct stock for order ${updatedOrder.order_code}`, err);
        // Continue without throwing to not crash webhook handler, but stock will be inconsistent
      }

      // Try to find the user_id of the creator to notify them
      let creatorUserId = undefined;
      if (updatedOrder.created_by) {
        try {
          const { data: creatorData } = await require('../config/supabase')
            .from('app_users')
            .select('user_id')
            .eq('full_name', updatedOrder.created_by)
            .limit(1)
            .single();
          if (creatorData) {
            creatorUserId = creatorData.user_id;
          }
        } catch (e) {
          console.error('Failed to find creator user_id:', e);
        }
      }

      try {
        await notificationService.createNotification({
          title: `Thanh toán thành công ${updatedOrder.order_code}`,
          message: `Đơn hàng ${updatedOrder.order_code} đã hoàn tất thanh toán trực tuyến qua PayOS`,
          type: 'PAYMENT_SUCCESS',
          related_link: '/sales',
          targetRoles: ['Quản trị viên', 'Chủ cửa hàng'],
          user_id: creatorUserId
        });
      } catch (notiErr) {
        console.error('Failed to create PAYMENT_SUCCESS notification:', notiErr);
      }

      return updatedOrder;
    }

    return order;
  }
}

module.exports = new OrderService();
