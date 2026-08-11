const notificationRepository = require('../repositories/notificationRepository');
const supabase = require('../config/supabase'); // For querying app_users

class NotificationService {
  // Map abstract roles to the exact Vietnamese strings in the database
  roleMap = {
    'ADMIN': 'Quản trị viên',
    'OWNER': 'Chủ cửa hàng',
    'WAREHOUSE_STAFF': 'Nhân viên kho',
    'SALES_STAFF': 'Nhân viên bán hàng'
  };

  /**
   * Main orchestrator for creating notifications securely.
   */
  async createNotification({
    type,
    title,
    message,
    severity = 'INFO',
    relatedType,
    relatedId,
    createdBy,
    recipientRoles = [],
    recipientUserIds = [],
    excludeUserIds = [],
    metadata = {},
    dedupKey
  }) {
    try {
      if (!type || !title || !message) {
        console.error('[NotificationService] Missing required fields for notification');
        return null;
      }

      // 1. Resolve users based on recipientRoles
      let targetUserIds = new Set(recipientUserIds || []);

      if (recipientRoles && recipientRoles.length > 0) {
        const mappedRoles = recipientRoles.map(r => this.roleMap[r]).filter(Boolean);
        if (mappedRoles.length > 0) {
          // Fetch active users with these roles
          const { data: users, error } = await supabase
            .from('app_users')
            .select('user_id')
            .in('role', mappedRoles)
            .eq('status', 'Đang hoạt động') // Only active users
            .is('deleted_at', null);

          if (!error && users) {
            users.forEach(u => targetUserIds.add(u.user_id));
          }
        }
      }

      // 2. Exclude users
      const excluded = new Set(excludeUserIds || []);
      // Automatically exclude the person who triggered the action, unless it's a payment failure etc.
      // We will rely on the caller to pass createdBy in excludeUserIds if they want it excluded,
      // but by default, we can exclude createdBy if it's not a systemic failure to avoid self-spam.
      if (createdBy && type !== 'PAYMENT_FAILED' && type !== 'PAYMENT_CANCELLED') {
        excluded.add(createdBy);
      }

      const finalUserIds = Array.from(targetUserIds).filter(id => !excluded.has(id));

      if (finalUserIds.length === 0) {
        console.log(`[NotificationService] No eligible recipients found for ${type}`);
        return null;
      }

      // 3. Generate Dedup Key if not provided
      const finalDedupKey = dedupKey || `${type}:${relatedType || 'NONE'}:${relatedId || 'NONE'}:${Date.now()}`;

      // 4. Construct payload
      const id = `NOTI_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const payload = {
        id,
        type,
        title,
        message,
        severity,
        related_type: relatedType,
        related_id: relatedId,
        created_by: createdBy,
        metadata,
        dedup_key: finalDedupKey
      };

      // 5. Call Repository
      return await notificationRepository.createWithRecipients(payload, finalUserIds);
    } catch (err) {
      console.error('[NotificationService] Unexpected error in createNotification:', err);
      // Suppress error to avoid breaking main business flow
      return null;
    }
  }

  /**
   * Helper to check inventory transitions and fire alerts safely
   */
  async checkAndCreateStockAlert({ productId, productName, oldStock, newStock, reorderLevel, movementId }) {
    try {
      const wasNormal = oldStock > reorderLevel;
      const isLow = newStock <= reorderLevel && newStock > 0;
      
      const wasNotOut = oldStock > 0;
      const isOut = newStock <= 0;

      // 1. OUT OF STOCK transition
      if (wasNotOut && isOut) {
        await this.createNotification({
          type: 'OUT_OF_STOCK',
          title: `[Hết hàng] ${productName}`,
          message: `Sản phẩm ${productName} (Mã: ${productId}) đã hết hàng.`,
          severity: 'CRITICAL',
          relatedType: 'PRODUCT',
          relatedId: productId,
          recipientRoles: ['ADMIN', 'OWNER', 'WAREHOUSE_STAFF', 'SALES_STAFF'],
          metadata: { productId, productName, stock: newStock },
          dedupKey: `OUT_OF_STOCK:PRODUCT:${productId}:MVMNT_${movementId}`
        });
        return; // Don't trigger low stock if it's out of stock
      }

      // 2. LOW STOCK transition
      if (wasNormal && isLow) {
        await this.createNotification({
          type: 'LOW_STOCK',
          title: `[Cảnh báo] Tồn kho thấp: ${productName}`,
          message: `Sản phẩm ${productName} hiện chỉ còn ${newStock} (Ngưỡng: ${reorderLevel}).`,
          severity: 'WARNING',
          relatedType: 'PRODUCT',
          relatedId: productId,
          recipientRoles: ['ADMIN', 'OWNER', 'WAREHOUSE_STAFF'],
          metadata: { productId, productName, stock: newStock, threshold: reorderLevel },
          dedupKey: `LOW_STOCK:PRODUCT:${productId}:MVMNT_${movementId}`
        });
      }
    } catch (err) {
      console.error('[NotificationService] Error in checkAndCreateStockAlert:', err);
    }
  }

  async getNotifications(userId, options = {}) {
    if (!userId) throw new Error("userId is required for getNotifications");
    
    const pageNum = Math.max(1, parseInt(options.page || 1));
    const limitNum = Math.min(50, Math.max(1, parseInt(options.limit || 15)));
    const status = options.status || 'ALL';
    const type = options.type || 'ALL';
    
    const { items, totalItems, totalPages } = await notificationRepository.findRecent(userId, pageNum, limitNum, status, type);
    const unreadCount = await notificationRepository.countUnread(userId);

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

  async getUnreadCount(userId) {
    if (!userId) return 0;
    return await notificationRepository.countUnread(userId);
  }

  async markAsRead(notificationId, userId) {
    if (!userId || !notificationId) return false;
    return await notificationRepository.markAsRead(notificationId, userId);
  }

  async markAllAsRead(userId) {
    if (!userId) return false;
    return await notificationRepository.markAllAsRead(userId);
  }
}

module.exports = new NotificationService();
