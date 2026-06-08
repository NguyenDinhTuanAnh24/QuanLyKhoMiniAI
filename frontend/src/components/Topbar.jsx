import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';

export default function Topbar({ activePage }) {
  const getBreadcrumbs = () => {
    switch (activePage) {
      case 'product-form': return ['Sản phẩm', 'Thêm / Sửa sản phẩm'];
      case 'categories': return ['Danh mục'];
      case 'units': return ['Đơn vị tính'];
      case 'suppliers': return ['Nhà cung cấp'];
      default: return ['Sản phẩm'];
    }
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <button className="text-slate-500 hover:text-slate-700 md:hidden">
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden md:flex text-sm text-slate-500">
          <span>Dashboard</span>
          {breadcrumbs.map((b, idx) => (
            <React.Fragment key={idx}>
              <span className="mx-2">/</span>
              <span className={idx === breadcrumbs.length - 1 ? "text-slate-900 font-medium" : ""}>{b}</span>
            </React.Fragment>
          ))}
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
