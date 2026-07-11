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
import { getUser } from '../services/authService';

const menuGroups = [
  {
    title: 'Tổng quan',
    items: [
      { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard }
    ]
  },
  {
    title: 'Quản lý kinh doanh',
    items: [
      { id: 'products', label: 'Sản phẩm', icon: Package },
      { id: 'inventory-ops', label: 'Nhập / Xuất kho', icon: ArrowLeftRight },
      { id: 'sales', label: 'Đơn bán hàng', icon: ShoppingCart }
    ]
  },
  {
    title: 'Giám sát & phân tích',
    items: [
      { id: 'alerts', label: 'Cảnh báo tồn kho', icon: AlertTriangle },
      { id: 'ai-insights', label: 'AI Dự báo', icon: Sparkles },
      { id: 'reports', label: 'Báo cáo', icon: BarChart3 }
    ]
  },
  {
    title: 'Quản trị hệ thống',
    items: [
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
    ]
  }
];

export default function Sidebar({ activePage, onNavigate }) {
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    const initialExpanded = {};
    menuGroups.forEach(group => {
      group.items.forEach(item => {
        if (item.children) {
          const hasActiveChild = item.children.some(child => child.id === activePage);
          if (hasActiveChild) {
            initialExpanded[item.id] = true;
          }
        }
      });
    });
    setExpandedGroups(prev => ({ ...prev, ...initialExpanded }));
  }, [activePage]);

  const toggleGroup = (itemId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
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
      
      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-6">
        {menuGroups.map((group, groupIdx) => {
          // Placeholder for role filtering
          const visibleItems = group.items;
          if (visibleItems.length === 0) return null;

          return (
            <div key={groupIdx} className="flex flex-col px-3">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-3 mb-2">
                {group.title}
              </h3>
              <div className="flex flex-col gap-1">
                {visibleItems.map(item => {
                  if (!item.children) {
                    const Icon = item.icon;
                    const isActive = isItemActive(item.id);
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
                        <span className="flex-1">{item.label}</span>
                        {isActive && (
                          <div className="absolute left-0 w-1 h-8 bg-blue-600 rounded-r-full"></div>
                        )}
                      </a>
                    );
                  } else {
                    const GroupIcon = item.icon;
                    const isExpanded = expandedGroups[item.id];
                    const hasActiveChild = item.children.some(child => isItemActive(child.id));
                    
                    return (
                      <div key={item.id} className="flex flex-col">
                        <button
                          onClick={() => toggleGroup(item.id)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${
                            hasActiveChild && !isExpanded
                              ? 'text-blue-700 bg-slate-50'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <GroupIcon className={`w-5 h-5 ${hasActiveChild ? 'text-blue-600' : 'text-slate-400'}`} />
                          <span className="flex-1">{item.label}</span>
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                        </button>
                        
                        {isExpanded && (
                          <div className="flex flex-col gap-1 mt-1 mb-2 px-2 pl-9">
                            {item.children.map(child => {
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
            </div>
          );
        })}
      </div>
    </aside>
  );
}
