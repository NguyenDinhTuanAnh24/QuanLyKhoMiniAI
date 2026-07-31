import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Menu, LogOut, User, Settings as SettingsIcon, CheckCircle2, AlertTriangle, ArrowDownRight, ArrowUpRight, ShoppingBag, CheckCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import ConfirmModal from './ConfirmModal';
import { logout, getUser } from '../services/authService';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';
import supabase from '../config/supabase';

export default function Topbar({ activePage, activePayload, onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Notification state
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNoti, setLoadingNoti] = useState(false);
  const notiDropdownRef = useRef(null);

  // User & Auth state (from develop)
  const user = getUser();
  const { showToast } = useToast();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const userDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notiDropdownRef.current && 
        !notiDropdownRef.current.contains(event.target) &&
        !event.target.closest('.noti-dropdown-wrapper')
      ) {
        setIsOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async (silent = false) => {
    if (!silent) setLoadingNoti(true);
    try {
      const res = await api.get('/notifications?page=1&limit=15');
      if (res.data && res.data.success) {
        setNotifications(res.data.data?.items || []);
        setUnreadCount(res.data.data?.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      if (!silent) setLoadingNoti(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Thiết lập kênh Realtime lắng nghe INSERT trên bảng notifications
    const channelName = `notifications-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: user?.user_id ? `user_id=eq.${user.user_id}` : undefined
        },
        (payload) => {
          // Optimistic update + lập tức đồng bộ dữ liệu từ API Backend
          if (payload.new) {
            setNotifications(prev => [payload.new, ...prev.slice(0, 14)]);
            setUnreadCount(prev => prev + 1);
          }
          fetchNotifications(true);
        }
      )
      .subscribe();

    // Khử trùng lặp kênh (Cleanup) để tránh rò rỉ bộ nhớ (Memory Leak)
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleToggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(prev => {
      const nextState = !prev;
      if (nextState) {
        // Luôn fetch dữ liệu tươi mới ngay khi mở dropdown
        fetchNotifications(true);
      }
      return nextState;
    });
  };

  const handleNotificationClick = async (noti) => {
    if (!noti.is_read) {
      setNotifications(prev => prev.map(n => n.id === noti.id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      try {
        await api.patch(`/notifications/${noti.id}/read`);
      } catch (err) {
        console.error('Failed to mark notification read:', err);
      }
    }
    setIsOpen(false);
    if (noti.related_link) {
      navigate(noti.related_link);
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await api.patch('/notifications/read-all');
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getNotiStyle = (type) => {
    switch (type) {
      case 'ORDER_NEW':
        return { bg: 'bg-blue-100 text-blue-600', icon: <ShoppingBag className="w-4 h-4" /> };
      case 'PAYMENT_SUCCESS':
        return { bg: 'bg-emerald-100 text-emerald-600', icon: <CheckCircle2 className="w-4 h-4" /> };
      case 'STOCK_LOW':
        return { bg: 'bg-rose-100 text-rose-600', icon: <AlertTriangle className="w-4 h-4" /> };
      case 'STOCK_IMPORT':
        return { bg: 'bg-amber-100 text-amber-600', icon: <ArrowDownRight className="w-4 h-4" /> };
      case 'STOCK_EXPORT':
        return { bg: 'bg-purple-100 text-purple-600', icon: <ArrowUpRight className="w-4 h-4" /> };
      default:
        return { bg: 'bg-slate-100 text-slate-600', icon: <Bell className="w-4 h-4" /> };
    }
  };

  const getPageTitle = (pathname) => {
    if (pathname.includes("dashboard")) return "Tổng quan";
    if (pathname.includes("products")) return "Quản lý sản phẩm";
    if (pathname.includes("inventory-ops") || pathname.includes("warehouse") || pathname.includes("stock-movements")) return "Nhập / Xuất kho";
    if (pathname.includes("sales") || pathname.includes("orders")) return "Đơn bán hàng";
    if (pathname.includes("alerts") || pathname.includes("stock-alerts")) return "Cảnh báo tồn kho";
    if (pathname.includes("ai")) return "AI Dự báo";
    if (pathname.includes("reports")) return "Báo cáo";
    if (pathname.includes("categories")) return "Quản lý danh mục";
    if (pathname.includes("units")) return "Quản lý đơn vị tính";
    if (pathname.includes("suppliers")) return "Quản lý nhà cung cấp";
    if (pathname.includes("users")) return "Quản lý người dùng";
    if (pathname.includes("settings")) return "Cài đặt hệ thống";
    
    return "Tổng quan";
  };

  const pageTitle = getPageTitle(location.pathname);

  const handleLogoutClick = () => {
    setIsDropdownOpen(false);
    setIsLogoutModalOpen(true);
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      showToast('Đăng xuất thành công', 'success');
      navigate('/login', { replace: true });
    } catch (error) {
      showToast('Lỗi khi đăng xuất', 'error');
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4 flex-1">
        <button className="text-slate-500 hover:text-slate-700 md:hidden">
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden md:block">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{pageTitle}</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Tìm kiếm nhanh..." 
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
          />
        </div>
        
        {/* Notification Bell with Dropdown Popover */}
        <div className="relative noti-dropdown-wrapper" ref={notiDropdownRef}>
          <button 
            type="button"
            onClick={handleToggleDropdown}
            className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Thông báo hệ thống"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white font-bold text-[10px] flex items-center justify-center rounded-full border border-white animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Dropdown Header */}
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 text-sm">Thông báo mới</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                      {unreadCount} chưa đọc
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button 
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors focus:outline-none"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Đánh dấu tất cả
                  </button>
                )}
              </div>

              {/* Dropdown List */}
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                {loadingNoti && notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm">Đang tải thông báo...</div>
                ) : notifications.length === 0 ? (
                  <div className="py-10 flex flex-col items-center justify-center text-slate-400">
                    <Bell className="w-10 h-10 text-slate-200 mb-2 stroke-1" />
                    <p className="text-sm font-medium text-slate-500">Không có thông báo mới</p>
                    <p className="text-xs text-slate-400 mt-0.5">Hệ thống đang hoạt động ổn định</p>
                  </div>
                ) : (
                  notifications.map((noti) => {
                    const style = getNotiStyle(noti.type);
                    return (
                      <div 
                        key={noti.id}
                        onClick={() => handleNotificationClick(noti)}
                        className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors hover:bg-slate-50 ${
                          !noti.is_read ? 'bg-blue-50/50 font-medium' : ''
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${style.bg}`}>
                          {style.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <h4 className={`text-xs ${!noti.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'} truncate`}>
                              {noti.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 flex-shrink-0">
                              {noti.created_at ? new Date(noti.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                            {noti.message}
                          </p>
                        </div>
                        {!noti.is_read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Dropdown Footer */}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <span className="text-[11px] text-slate-400">
                  ⚡ Supabase Realtime Active • <strong className="text-slate-600 font-medium">Smart Retail AI</strong>
                </span>
              </div>
            </div>
          )}
        </div>
        
        <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>
        
        <div className="flex items-center gap-3 relative" ref={userDropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-lg transition-colors text-left"
          >
            <div className="hidden sm:flex flex-col items-end max-w-[150px]">
              <span className="text-sm font-medium text-slate-900 leading-none truncate w-full text-right">{user?.full_name || 'Admin'}</span>
              <span className="text-xs text-slate-500 mt-1 truncate w-full text-right">{user?.role || 'Quản trị viên'}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
              <User className="w-5 h-5" />
            </div>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 mb-1 sm:hidden">
                <span className="block text-sm font-medium text-slate-900">{user?.full_name || 'Admin'}</span>
                <span className="block text-xs text-slate-500">{user?.role || 'Quản trị viên'}</span>
              </div>
              <button 
                onClick={() => {
                  setIsDropdownOpen(false);
                  navigate('/settings?tab=account');
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
              >
                <User className="w-4 h-4" />
                Thông tin tài khoản
              </button>
              <button 
                onClick={() => {
                  setIsDropdownOpen(false);
                  onNavigate('settings');
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
              >
                <SettingsIcon className="w-4 h-4" />
                Cài đặt
              </button>
              <div className="h-px bg-slate-100 my-1"></div>
              <button 
                onClick={handleLogoutClick}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
        title="Xác nhận đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?"
        confirmText="Đăng xuất"
        cancelText="Hủy"
        isDanger={true}
        loading={isLoggingOut}
      />
    </header>
  );
}
