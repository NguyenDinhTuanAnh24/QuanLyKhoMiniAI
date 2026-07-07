import React from 'react';
import { Search, Bell, Menu, LogOut, User } from 'lucide-react';

import { useLocation, useNavigate } from 'react-router-dom';

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
  
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
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
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium text-slate-900 leading-none">{user?.full_name || 'Admin'}</span>
            <span className="text-xs text-slate-500 mt-1">{user?.role || 'Quản trị viên'}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
            <User className="w-5 h-5" />
          </div>
          <button 
            onClick={handleLogout}
            title="Đăng xuất"
            className="ml-2 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
