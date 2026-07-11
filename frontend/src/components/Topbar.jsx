import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Menu, LogOut, User, Settings as SettingsIcon } from 'lucide-react';

import { useLocation, useNavigate } from 'react-router-dom';
import ConfirmModal from './ConfirmModal';
import { logout, getUser } from '../services/authService';
import { useToast } from '../contexts/ToastContext';

export default function Topbar({ activePage, activePayload, onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();

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
  
  const user = getUser();

  const { showToast } = useToast();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
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
        
        <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        
        <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>
        
        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
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
