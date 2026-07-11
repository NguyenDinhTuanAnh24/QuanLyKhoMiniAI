const notificationRepository = require('../repositories/notificationRepository');

class NotificationService {
  async createNotification({ user_id = 'ALL', title, message, type, related_link }) {
    const id = `NOTI-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    return await notificationRepository.create({
      id,
      user_id,
      title,
      message,
      type,
      is_read: false,
      related_link: related_link || '/'
    });
  }

  async checkAndCreateLowStockAlert(productId, productName, currentStock, reorderLevel) {
    try {
      // Logic Chống Spam: Kiểm tra trong 24h qua đã có thông báo STOCK_LOW nào cho productId này chưa
      const existingAlert = await notificationRepository.findRecentLowStockByProductId(productId, 24);
      if (existingAlert) {
        console.log(`[NotificationService] Skip low stock alert for ${productId}: Cooldown active (24h)`);
        return null;
      }

      const isCritical = currentStock === 0 || currentStock <= (0.2 * reorderLevel);
      const title = isCritical 
        ? `[Nguy cấp] Hết/Sắp hết hàng: ${productName}` 
        : `[Cảnh báo] Tồn kho thấp: ${productName}`;
      const message = `Sản phẩm ${productName} (${productId}) hiện chỉ còn ${currentStock} (Ngưỡng an toàn: ${reorderLevel}). Vui lòng lên kế hoạch nhập hàng ngay!`;

      return await this.createNotification({
        title,
        message,
        type: 'STOCK_LOW',
        related_link: '/alerts'
      });
    } catch (err) {
      console.error('[NotificationService] Error in checkAndCreateLowStockAlert:', err);
      return null;
    }
  }

  async getNotifications(page = 1, limit = 15, userId = 'ALL') {
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    
    const { items, totalItems } = await notificationRepository.findRecent(pageNum, limitNum, userId);
    const unreadCount = await notificationRepository.countUnread(userId);
    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    return {
      items,
      unreadCount,
      pagination: {
        currentPage: pageNum,
        limit: limitNum,
        totalItems,
        totalPages
      }
    };
  }

  async markAsRead(id) {
    return await notificationRepository.markAsRead(id);
  }

  async markAllAsRead(userId = 'ALL') {
    return await notificationRepository.markAllAsRead(userId);
  }
}

module.exports = new NotificationService();
