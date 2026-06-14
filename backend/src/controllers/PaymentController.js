const OrderService = require('../services/OrderService');
const PayOSService = require('../services/PayOSService');
const { z } = require('zod');

const createOrderSchema = z.object({
  customer_name: z.string().min(1, 'Tên khách hàng không được để trống'),
  customer_phone: z.string()
    .regex(/^0\d{9}$/, 'Số điện thoại phải bắt đầu bằng số 0 và có đúng 10 chữ số')
    .optional()
    .nullable()
    .or(z.literal('')),
  payment_method: z.literal('Chuyển khoản'),
  total_amount: z.number().min(0),
  items: z.array(z.object({
    product_id: z.string().min(1),
    quantity: z.number().int().min(1),
    unit_price: z.number().min(0),
  })).min(1, 'Order must contain at least one item'),
});

class PaymentController {
  async createPayOSPayment(req, res, next) {
    try {
      const validatedData = createOrderSchema.parse(req.body);

      // Create pending order
      const { order, items } = await OrderService.createOrder(validatedData);

      // Prepare items for payos
      const payosItems = items.map(item => ({
        name: `Sản phẩm ${item.product_id}`,
        quantity: item.quantity,
        price: item.unit_price
      }));

      const transferText = PayOSService.normalizeTransferText(`${order.customer_name} ${order.order_code}`).substring(0, 50);

      const paymentData = {
        orderCode: order.payos_order_code,
        amount: order.total_amount,
        description: transferText,
        items: payosItems,
        cancelUrl: process.env.FRONTEND_URL + '/sales',
        returnUrl: process.env.FRONTEND_URL + '/sales'
      };

      const payosRes = await PayOSService.createPaymentLink(paymentData);

      // We might need to save checkoutUrl, but since we use QR code directly, we can just return it.
      res.status(200).json({
        success: true,
        data: {
          order_id: order.order_id,
          order_code: order.order_code,
          payos_order_code: order.payos_order_code,
          payment_link_id: payosRes.paymentLinkId,
          checkout_url: payosRes.checkoutUrl,
          qr_code: payosRes.qrCode,
          amount: order.total_amount,
          transfer_content: transferText,
          payment_status: order.payment_status
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
      }
      next(error);
    }
  }

  async handlePayOSWebhook(req, res, next) {
    if (req.body.data?.desc === 'confirm-webhook' || req.body.data?.orderCode === 123) {
      return res.status(200).json({ success: true, message: "Ping webhook test successful" });
    }

    try {
      console.log("--- WEBHOOK RECEIVED ---");
      console.log("req.body:", JSON.stringify(req.body, null, 2));
      const webhookData = PayOSService.verifyWebhookData(req.body);
      console.log("webhookData:", JSON.stringify(webhookData, null, 2));

      const orderCode = Number(webhookData.orderCode);
      const result = await OrderService.processSuccessfulPayment(orderCode);
      if (!result) {
        console.warn(`PayOS webhook: Order not found for orderCode ${orderCode}`);
      } else {
        console.log(`PayOS webhook: Successfully processed order ${orderCode}`);
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("PayOS Webhook error:", error);
      res.status(400).json({ success: false, message: "Webhook error" });
    }
  }
}

module.exports = new PaymentController();
