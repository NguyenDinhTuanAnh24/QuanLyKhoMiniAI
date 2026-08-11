import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import supabase from '../config/supabase';
import { getUser } from '../services/authService';
import { useToast } from './ToastContext'; // Assuming this exists

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const user = getUser();
  const { showToast } = useToast();

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/notifications?page=1&limit=15');
      if (res.data && res.data.success) {
        setNotifications(res.data.data?.items || []);
        
        // Also fetch accurate unread count in case it diverges
        const countRes = await api.get('/notifications/unread-count');
        if (countRes.data && countRes.data.success) {
          setUnreadCount(countRes.data.data.unreadCount || 0);
        } else {
          // Fallback to items calculation if unread-count fails
          setUnreadCount(res.data.data?.items.filter(n => !n.is_read).length || 0);
        }
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    // Listen to notification_recipients table for this specific user
    const channelName = `user-notifications-${user.user_id}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notification_recipients',
          filter: `user_id=eq.${user.user_id}`
        },
        (payload) => {
          if (payload.new) {
            // Trigger a re-fetch to get the full joined notification payload
            // In a highly optimized app, we'd fetch just the notification_id, but re-fetching top 15 is safe enough
            fetchNotifications(true);
            
            // Show toast for new notification
            showToast('Bạn có thông báo mới!', 'info');
          }
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'notification_recipients',
          filter: `user_id=eq.${user.user_id}`
        },
        (payload) => {
          if (payload.new) {
             // E.g. marked as read from another device
             fetchNotifications(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications, showToast]);

  const markAsRead = async (id) => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch (err) {
      console.error('Failed to mark notification read:', err);
      // Revert on failure
      fetchNotifications(true);
    }
  };

  const markAllAsRead = async () => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    
    try {
      await api.patch('/notifications/read-all');
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      // Revert on failure
      fetchNotifications(true);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
