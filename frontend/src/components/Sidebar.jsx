import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ArrowLeftRight, 
  ShoppingCart, 
  AlertTriangle,
  BarChart3, 
  Sparkles, 
  Users, 
  Settings,
  Database,
  Tags,
  Ruler,
  Truck,
  ChevronDown
} from 'lucide-react';

const menuConfig = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'products', label: 'Sản phẩm', icon: Package },
  { id: 'inventory-ops', label: 'Nhập / Xuất kho', icon: ArrowLeftRight },
  { id: 'sales', label: 'Đơn bán hàng', icon: ShoppingCart },
  { id: 'alerts', label: 'Cảnh báo tồn kho', icon: AlertTriangle },
  { id: 'ai-insights', label: 'AI Dự báo', icon: Sparkles },
  { id: 'reports', label: 'Báo cáo', icon: BarChart3 },
  {
    id: 'master-data',
    label: 'Dữ liệu nền',
    icon: Database,
    children: [
      { id: 'categories', label: 'Danh mục', icon: Tags },
      { id: 'units', label: 'Đơn vị tính', icon: Ruler },
      { id: 'suppliers', label: 'Nhà cung cấp', icon: Truck },
    ]
  },
  { id: 'users', label: 'Người dùng', icon: Users },
  { id: 'settings', label: 'Cài đặt', icon: Settings }
];

export default function Sidebar({ activePage, onNavigate }) {
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    const initialExpanded = {};
    menuConfig.forEach(group => {
      if (group.children) {
        const hasActiveChild = group.children.some(child => child.id === activePage);
        if (hasActiveChild) {
          initialExpanded[group.id] = true;
        }
      }
    });
    setExpandedGroups(prev => ({ ...prev, ...initialExpanded }));
  }, [activePage]);

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const isItemActive = (id) => {
    return activePage === id;
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0">
      <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
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
        {menuConfig.map(group => {
          if (!group.children) {
            const Icon = group.icon;
            const isActive = isItemActive(group.id);
            return (
              <a 
                key={group.id} 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(group.id);
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="flex-1">{group.label}</span>
                {isActive && (
                  <div className="absolute left-0 w-1 h-8 bg-blue-600 rounded-r-full"></div>
                )}
              </a>
            );
          } else {
            const GroupIcon = group.icon;
            const isExpanded = expandedGroups[group.id];
            const hasActiveChild = group.children.some(child => isItemActive(child.id));
            
            return (
              <div key={group.id} className="flex flex-col">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${
                    hasActiveChild && !isExpanded
                      ? 'text-blue-700 bg-slate-50'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <GroupIcon className={`w-5 h-5 ${hasActiveChild ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="flex-1">{group.label}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                </button>
                
                {isExpanded && (
                  <div className="flex flex-col gap-1 mt-1 mb-2 px-2 pl-9">
                    {group.children.map(child => {
                      const ChildIcon = child.icon;
                      const isChildActive = isItemActive(child.id);
                      return (
                        <a 
                          key={child.id} 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            onNavigate(child.id);
                          }}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                            isChildActive 
                              ? 'bg-blue-50 text-blue-700 font-medium' 
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <ChildIcon className={`w-4 h-4 ${isChildActive ? 'text-blue-600' : 'text-slate-400'}`} />
                          <span className="flex-1">{child.label}</span>
                          {isChildActive && (
                            <div className="absolute left-0 w-1 h-6 bg-blue-600 rounded-r-full"></div>
                          )}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
        })}
      </div>

      <div className="p-4 border-t border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
            {(() => {
              const userStr = localStorage.getItem('user');
              const user = userStr ? JSON.parse(userStr) : null;
              return user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'A';
            })()}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">
              {(() => {
                const userStr = localStorage.getItem('user');
                const user = userStr ? JSON.parse(userStr) : null;
                return user?.full_name || 'Admin';
              })()}
            </div>
            <div className="text-xs text-slate-500">
              {(() => {
                const userStr = localStorage.getItem('user');
                const user = userStr ? JSON.parse(userStr) : null;
                return user?.role || 'Quản trị viên';
              })()}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
