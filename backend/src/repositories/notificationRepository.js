const supabase = require('../config/supabase');

class NotificationRepository {
  async create(data) {
    try {
      const { data: result, error } = await supabase
        .from('notifications')
        .insert([data])
        .select()
        .single();
        
      if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01') {
          console.warn(`[NotificationRepository] Table 'notifications' not found on Supabase. Please run database/schema.sql on Supabase SQL Editor.`);
          return data;
        }
        throw error;
      }
      return result;
    } catch (err) {
      console.error('[NotificationRepository] Error creating notification:', err.message || err);
      return data;
    }
  }

  async findRecent(page = 1, limit = 15, userId = 'ALL') {
    try {
      const offset = (page - 1) * limit;
      const { data, error, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .or(`user_id.eq.${userId},user_id.eq.ALL`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01') {
          console.warn(`[NotificationRepository] Table 'notifications' not found on Supabase. Returning empty list.`);
          return { items: [], totalItems: 0 };
        }
        throw error;
      }
      return { items: data || [], totalItems: count || 0 };
    } catch (err) {
      console.error('[NotificationRepository] Error finding recent notifications:', err.message || err);
      return { items: [], totalItems: 0 };
    }
  }

  async countUnread(userId = 'ALL') {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .or(`user_id.eq.${userId},user_id.eq.ALL`)
        .eq('is_read', false);

      if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01') {
          return 0;
        }
        throw error;
      }
      return count || 0;
    } catch (err) {
      console.error('[NotificationRepository] Error counting unread notifications:', err.message || err);
      return 0;
    }
  }

  async markAsRead(id) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01') {
          return true;
        }
        throw error;
      }
      return true;
    } catch (err) {
      console.error('[NotificationRepository] Error marking as read:', err.message || err);
      return true;
    }
  }

  async markAllAsRead(userId = 'ALL') {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .or(`user_id.eq.${userId},user_id.eq.ALL`)
        .eq('is_read', false);

      if (error && error.code !== 'PGRST205' && error.code !== '42P01') {
        throw error;
      }
      return true;
    } catch (err) {
      console.error('[NotificationRepository] Error marking all as read:', err.message || err);
      return true;
    }
  }

  async findRecentLowStockByProductId(productId, hours = 24) {
    try {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('notifications')
        .select('id, created_at')
        .eq('type', 'STOCK_LOW')
        .ilike('message', `%(${productId})%`)
        .gte('created_at', cutoffTime)
        .limit(1);

      if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01') {
          return null;
        }
        throw error;
      }
      return data && data.length > 0 ? data[0] : null;
    } catch (err) {
      console.error('[NotificationRepository] Error finding recent low stock notification:', err.message || err);
      return null;
    }
  }
}

module.exports = new NotificationRepository();
