import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Bell, Menu, LogOut, User, Settings as SettingsIcon, CheckCircle2, AlertTriangle, ArrowDownRight, ArrowUpRight, ShoppingBag, CheckCheck, Zap } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import ConfirmModal from './ConfirmModal';
import { logout, getUser } from '../services/authService';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';
import { useNotifications } from '../contexts/NotificationContext';

export default function Topbar({ activePage, activePayload, onNavigate, toggleSidebar, isSidebarOpen, setIsSidebarOpen }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Notification state from context
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const notiDropdownRef = useRef(null);

  // User & Auth state (from develop)
  const [user, setUser] = useState(getUser());
  const { showToast } = useToast();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const userDropdownRef = useRef(null);

  useEffect(() => {
    const handleUserUpdate = () => {
      setUser(getUser());
    };
    window.addEventListener('userUpdated', handleUserUpdate);
    return () => window.removeEventListener('userUpdated', handleUserUpdate);
  }, []);

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

  // Removed duplicate local realtime and fetch logic. Handled by NotificationContext.

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
      await markAsRead(noti.notification_id || noti.id);
    }
    setIsOpen(false);
    if (noti.related_link) {
      navigate(noti.related_link);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const getNotiStyle = (type) => {
    switch (type) {
      case 'SALE_COMPLETED':
        return { bg: 'bg-blue-100 text-blue-600', icon: <ShoppingBag className="w-4 h-4" /> };
      case 'PAYMENT_SUCCESS':
        return { bg: 'bg-emerald-100 text-emerald-600', icon: <CheckCircle2 className="w-4 h-4" /> };
      case 'STOCK_LOW':
        return { bg: 'bg-rose-100 text-rose-600', icon: <AlertTriangle className="w-4 h-4" /> };
      case 'STOCK_IMPORTED':
        return { bg: 'bg-amber-100 text-amber-600', icon: <ArrowDownRight className="w-4 h-4" /> };
      case 'STOCK_EXPORTED':
        return { bg: 'bg-blue-100 text-blue-600', icon: <ArrowUpRight className="w-4 h-4" /> };
      default:
        return { bg: 'bg-slate-100 text-slate-600', icon: <Bell className="w-4 h-4" /> };
    }
  };

  const getAvatarInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

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
        <button onClick={toggleSidebar} className="text-slate-500 hover:text-slate-700 lg:hidden focus:outline-none">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center justify-end gap-3 sm:gap-4 ml-auto">
        
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
            <>
              {/* Desktop Dropdown */}
              <div className="hidden sm:block absolute right-0 mt-2 w-[380px] bg-white rounded-xl shadow-2xl border border-slate-200 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
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

                <div className="max-h-[min(70vh,520px)] overflow-y-auto divide-y divide-slate-100 overscroll-contain">
                  {!notifications || notifications.length === 0 ? (
                    <div className="py-10 flex flex-col items-center justify-center text-slate-400">
                      <Bell className="w-10 h-10 text-slate-200 mb-2 stroke-1" />
                      <p className="text-sm font-medium text-slate-500">Không có thông báo mới</p>
                    </div>
                  ) : (
                    notifications.map((noti) => {
                      const style = getNotiStyle(noti.type);
                      return (
                        <div 
                          key={noti.notification_id || noti.id}
                          onClick={() => handleNotificationClick(noti)}
                          className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors hover:bg-slate-50 ${
                            !noti.is_read ? 'bg-blue-50/50 font-medium' : ''
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${style.bg}`}>
                            {style.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-0.5">
                              <h4 className={`text-xs ${!noti.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'} line-clamp-1 break-all`}>
                                {noti.title}
                              </h4>
                              <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">
                                {noti.created_at ? new Date(noti.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                              {noti.message}
                            </p>
                          </div>
                          {!noti.is_read && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5 ml-1" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Mobile Overlay Portal */}
              {createPortal(
                <div className="sm:hidden fixed inset-0 z-[80] flex flex-col justify-end">
                  <div className="absolute inset-0 bg-slate-900/35" onClick={() => setIsOpen(false)}></div>
                  <div className="relative bg-white rounded-t-2xl shadow-xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-full duration-300">
                    <div className="px-4 py-4 bg-white border-b border-slate-100 flex items-center justify-between rounded-t-2xl shrink-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 text-[15px]">Thông báo</h3>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                            {unreadCount} chưa đọc
                          </span>
                        )}
                      </div>
                      <button onClick={() => setIsOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>

                    <div className="overflow-y-auto overscroll-contain flex-1">
                      {!notifications || notifications.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                          <Bell className="w-12 h-12 text-slate-200 mb-3 stroke-1" />
                          <p className="text-[15px] font-medium text-slate-500">Không có thông báo mới</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 pb-safe">
                          {notifications.map((noti) => {
                            const style = getNotiStyle(noti.type);
                            return (
                              <div 
                                key={noti.notification_id || noti.id}
                                onClick={() => handleNotificationClick(noti)}
                                className={`p-4 flex items-start gap-3 active:bg-slate-50 transition-colors ${
                                  !noti.is_read ? 'bg-blue-50/30' : ''
                                }`}
                              >
                                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${style.bg}`}>
                                  {style.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <h4 className={`text-[13px] ${!noti.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'} line-clamp-2 leading-tight break-all`}>
                                      {noti.title}
                                    </h4>
                                    <span className="text-[11px] text-slate-400 flex-shrink-0 whitespace-nowrap mt-0.5 ml-1">
                                      {noti.created_at ? new Date(noti.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                                    {noti.message}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0 pb-safe">
                      {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllAsRead}
                          className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-[13px] font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                        >
                          Đọc tất cả
                        </button>
                      )}
                      <button 
                        onClick={() => { setIsOpen(false); if(onNavigate) onNavigate('notifications'); }}
                        className="flex-1 py-2.5 bg-blue-600 text-white text-[13px] font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                      >
                        Xem tất cả
                      </button>
                    </div>
                  </div>
                </div>,
                document.body
              )}
            </>
          )}
        </div>
        
        <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>
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
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="w-9 h-9 rounded-full object-cover border border-slate-200" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
            ) : null}
            <div className={`w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 ${user?.avatar_url ? 'hidden' : ''} font-bold text-sm shrink-0`}>
              {getAvatarInitials(user?.full_name)}
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
