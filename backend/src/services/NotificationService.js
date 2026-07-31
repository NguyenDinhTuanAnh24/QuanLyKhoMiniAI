const notificationRepository = require('../repositories/notificationRepository');
const supabase = require('../config/supabase');

class NotificationService {
  async createNotification({ user_id, targetRoles, title, message, type, related_link }) {
    try {
      let targetUserIds = [];

      // If specific targetRoles are provided, query users who have those roles
      if (targetRoles && Array.isArray(targetRoles) && targetRoles.length > 0) {
        const { data: users, error } = await supabase
          .from('app_users')
          .select('user_id')
          .in('role', targetRoles)
          .eq('status', 'Đang hoạt động')
          .is('deleted_at', null);
          
        if (!error && users && users.length > 0) {
          targetUserIds = users.map(u => u.user_id);
        }
      } 
      
      // If a specific user_id is provided, add it to the list
      if (user_id && user_id !== 'ALL') {
        targetUserIds.push(user_id);
      } 
      // Fallback: everyone if nothing is specified (legacy behavior)
      else if (targetUserIds.length === 0 && (!user_id || user_id === 'ALL')) {
        targetUserIds = ['ALL'];
      }

      // Remove duplicates
      targetUserIds = [...new Set(targetUserIds)];

      if (targetUserIds.length === 0) return null;

      const baseTimestamp = Date.now();
      const payload = targetUserIds.map((uid, index) => ({
        id: `NOTI-${baseTimestamp}-${index}-${Math.floor(Math.random() * 1000)}`,
        user_id: uid,
        title,
        message,
        type,
        is_read: false,
        related_link: related_link || '/'
      }));

      return await notificationRepository.create(payload);
    } catch (err) {
      console.error('[NotificationService] Error in createNotification:', err);
      return null;
    }
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
        related_link: '/alerts',
        targetRoles: ['Quản trị viên', 'Chủ cửa hàng', 'Nhân viên kho']
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
