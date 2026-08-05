const OrderService = require('../services/OrderService');
const { z } = require('zod');

const orderItemSchema = z.object({
  product_id: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().min(0, 'Unit price cannot be negative'),
});

const createOrderSchema = z.object({
  order_code: z.string().optional(),
  customer_name: z.string().min(1, 'Tên khách hàng không được để trống'),
  customer_phone: z.string()
    .regex(/^0\d{9}$/, 'Số điện thoại phải bắt đầu bằng số 0 và có đúng 10 chữ số')
    .optional()
    .nullable()
    .or(z.literal('')),
  payment_method: z.string().min(1, 'Payment method is required'),
  total_amount: z.number().min(0),
  items: z.array(orderItemSchema).min(1, 'Order must contain at least one item'),
});

class OrderController {
  async createOrder(req, res, next) {
    try {
      const validatedData = createOrderSchema.parse(req.body);
      const result = await OrderService.createOrder(validatedData);
      
      const ActivityLogService = require('../services/ActivityLogService');
      await ActivityLogService.logActivity({
        user_id: req.user ? req.user.user_id : null,
        user_name: req.user ? req.user.full_name : 'Unknown',
        action: 'CREATE_ORDER',
        entity_type: 'ORDER',
        entity_id: result.order.order_id,
        details: { role: req.user.role, status: 'Thành công', total_amount: result.order.total_amount, customer_name: result.order.customer_name }
      });
      
      res.status(201).json({ success: true, data: result.order });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
      }
      next(error);
    }
  }

  async getRecentOrders(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const orders = await OrderService.getRecentOrders(limit);
      res.status(200).json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentStatus(req, res, next) {
    try {
      const statusData = await OrderService.getOrderPaymentStatus(req.params.orderId);
      res.status(200).json({ success: true, data: statusData });
    } catch (error) {
      next(error);
    }
  }

  async getProductConsumption(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const data = await OrderService.getProductConsumption(limit);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();
