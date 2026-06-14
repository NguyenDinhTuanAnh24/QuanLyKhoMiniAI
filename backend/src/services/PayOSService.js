const PayOS = require('@payos/node');

const payOS = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

class PayOSService {
  normalizeTransferText(text) {
    return String(text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  async createPaymentLink(orderPayload) {
    // orderPayload should include: orderCode, amount, description, items, cancelUrl, returnUrl
    const paymentLinkData = {
      orderCode: orderPayload.orderCode,
      amount: orderPayload.amount,
      description: orderPayload.description,
      items: orderPayload.items,
      cancelUrl: orderPayload.cancelUrl,
      returnUrl: orderPayload.returnUrl,
    };
    
    return await payOS.createPaymentLink(paymentLinkData);
  }

  verifyWebhookData(webhookBody) {
    return payOS.verifyPaymentWebhookData(webhookBody);
  }
}

module.exports = new PayOSService();
