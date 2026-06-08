import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  Ruler,
  Truck, 
  Download, 
  ShoppingCart, 
  Boxes, 
  BarChart3, 
  Sparkles, 
  Users, 
  Settings 
} from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Sản phẩm', icon: Package },
  { id: 'categories', label: 'Danh mục', icon: Tags },
  { id: 'units', label: 'Đơn vị tính', icon: Ruler },
  { id: 'suppliers', label: 'Nhà cung cấp', icon: Truck },
  { id: 'import', label: 'Nhập kho', icon: Download },
  { id: 'sales', label: 'Bán hàng', icon: ShoppingCart },
  { id: 'inventory', label: 'Tồn kho', icon: Boxes },
  { id: 'reports', label: 'Báo cáo', icon: BarChart3 },
  { id: 'ai-insights', label: 'AI Insights', icon: Sparkles },
  { id: 'users', label: 'Người dùng', icon: Users },
  { id: 'settings', label: 'Cài đặt', icon: Settings },
];

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0">
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center font-bold text-lg">
            SR
          </div>
          <div>
            <div className="font-bold text-slate-800 leading-tight">Smart Retail</div>
            <div className="text-xs text-slate-500 leading-tight">Inventory AI</div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activePage === item.id || (activePage === 'product-form' && item.id === 'products');
          return (
            <a 
              key={item.id} 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                onNavigate(item.id);
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              {item.label}
              {isActive && (
                <div className="absolute left-0 w-1 h-8 bg-blue-600 rounded-r-full"></div>
              )}
            </a>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
            A
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">Nguyễn Admin</div>
            <div className="text-xs text-slate-500">Quản trị viên</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
