const supabase = require('../config/supabase');
const crypto = require('crypto');

class NotificationRepository {
  async createWithRecipients(notificationData, userIds) {
    try {
      // Check dedup_key
      if (notificationData.dedup_key) {
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('dedup_key', notificationData.dedup_key)
          .single();
        if (existing) {
          // It's a duplicate, just return it or silently ignore
          return existing;
        }
      }

      // 1. Insert into notifications
      const { data: notif, error: notifErr } = await supabase
        .from('notifications')
        .insert([notificationData])
        .select()
        .single();

      if (notifErr) {
        throw notifErr;
      }

      // 2. Insert into notification_recipients
      if (userIds && userIds.length > 0) {
        const recipients = userIds.map(userId => ({
          id: `REC_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          notification_id: notif.id,
          user_id: userId,
          is_read: false
        }));

        const { error: recErr } = await supabase
          .from('notification_recipients')
          .insert(recipients);

        if (recErr) {
          console.error('[NotificationRepository] Error inserting recipients:', recErr);
          // Don't throw, we at least saved the notification
        }
      }

      return notif;
    } catch (err) {
      console.error('[NotificationRepository] Error creating notification:', err.message || err);
      throw err; // DO NOT swallow error per prompt Phase 3
    }
  }

  async findRecent(userId, page = 1, limit = 15, status = 'ALL', type = 'ALL') {
    try {
      const offset = (page - 1) * limit;
      let query = supabase
        .from('notification_recipients')
        .select('*, notifications!inner(*)', { count: 'exact' })
        .eq('user_id', userId);

      if (status === 'UNREAD') {
        query = query.eq('is_read', false);
      } else if (status === 'READ') {
        query = query.eq('is_read', true);
      }

      if (type !== 'ALL') {
        query = query.eq('notifications.type', type);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      // Flatten the response
      const items = data.map(row => ({
        ...row.notifications,
        recipient_id: row.id,
        is_read: row.is_read,
        read_at: row.read_at
      }));

      const totalPages = Math.ceil(count / limit) || 0;
      return { 
        items: items || [], 
        totalItems: count || 0,
        totalPages: totalPages 
      };
    } catch (err) {
      console.error('[NotificationRepository] Error finding recent notifications:', err.message || err);
      throw err;
    }
  }

  async countUnread(userId) {
    try {
      const { count, error } = await supabase
        .from('notification_recipients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        throw error;
      }
      return count || 0;
    } catch (err) {
      console.error('[NotificationRepository] Error counting unread notifications:', err.message || err);
      throw err;
    }
  }

  async markAsRead(notificationId, userId) {
    try {
      const { data, error } = await supabase
        .from('notification_recipients')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('notification_id', notificationId)
        .eq('user_id', userId)
        .select();

      if (error) {
        throw error;
      }
      if (!data || data.length === 0) {
        return false;
      }
      return true;
    } catch (err) {
      console.error('[NotificationRepository] Error marking as read:', err.message || err);
      throw err;
    }
  }

  async markAllAsRead(userId) {
    try {
      const { error } = await supabase
        .from('notification_recipients')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        throw error;
      }
      return true;
    } catch (err) {
      console.error('[NotificationRepository] Error marking all as read:', err.message || err);
      throw err;
    }
  }
}

module.exports = new NotificationRepository();
