import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';

export default function Topbar({ activePage, activePayload, onNavigate }) {
  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard': return 'Tổng quan';
      case 'products': return 'Quản lý sản phẩm';
      case 'categories': return 'Quản lý danh mục';
      case 'units': return 'Quản lý đơn vị tính';
      case 'suppliers': return 'Quản lý nhà cung cấp';
      case 'stock-movements': 
      case 'warehouse':
      case 'import-stock':
      case 'inventory-ops': return 'Nhập / Xuất kho';
      case 'orders':
      case 'sales': return 'Đơn bán hàng';
      case 'inventory':
      case 'stock-alerts': return 'Cảnh báo tồn kho';
      case 'ai-insights':
      case 'ai-forecast': return 'AI Dự báo & Gợi ý';
      case 'reports': return 'Báo cáo & Phân tích';
      case 'users': return 'Quản lý người dùng';
      case 'settings': return 'Cài đặt hệ thống';
      default: return 'Smart Retail Inventory AI';
    }
  };

  const pageTitle = getPageTitle();

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
      </div>
    </header>
  );
}
