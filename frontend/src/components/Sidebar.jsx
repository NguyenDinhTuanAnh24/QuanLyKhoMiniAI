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
  History,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getUser } from '../services/authService';

import { useBranding } from '../contexts/BrandingContext';

const getBrandInitials = (name) => {
  if (!name) return 'SR';
  const words = name.trim().split(' ');
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

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
      { id: 'activity-logs', label: 'Nhật ký hoạt động', icon: History },
      { id: 'settings', label: 'Cài đặt', icon: Settings }
    ]
  }
];

export default function Sidebar({ activePage, onNavigate, isOpen, setIsOpen, isCollapsed, toggleCollapse }) {
  const [expandedGroups, setExpandedGroups] = useState({});
  const { branding } = useBranding();

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
    if (isCollapsed) {
      toggleCollapse();
    }
    setExpandedGroups(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const isItemActive = (id) => {
    return activePage === id;
  };

  const user = getUser();
  const roleCode = user?.roleCode || user?.role;
  const isAdmin = roleCode === 'ADMIN' || user?.role === 'Quản trị viên';
  const isOwner = roleCode === 'OWNER' || user?.role === 'Chủ cửa hàng';
  const isWarehouseStaff = roleCode === 'WAREHOUSE_STAFF' || user?.role === 'Nhân viên kho';
  const isSalesStaff = roleCode === 'SALES_STAFF' || user?.role === 'Nhân viên bán hàng';
  const isAdminOrOwner = isAdmin || isOwner;


  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside className={`bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-40 transition-[width] duration-300 ease-in-out ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'} ${isCollapsed ? 'lg:w-[72px]' : 'lg:w-60'}`}>

        <div className={`h-16 flex items-center border-b border-gray-200 shrink-0 ${isCollapsed ? 'justify-center px-0' : 'px-4 gap-3'}`}>
          {branding?.logoUrl ? (
            <div className={`rounded-xl flex items-center justify-center overflow-hidden shrink-0 bg-slate-50 border border-slate-200 ${isCollapsed ? 'w-10 h-10' : 'w-10 h-10'}`}>
              <img src={branding.logoUrl} alt={branding.storeName} className="w-full h-full object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
              <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm hidden rounded-xl">
                {getBrandInitials(branding.storeName)}
              </div>
            </div>
          ) : (
            <div className={`bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold shrink-0 ${isCollapsed ? 'w-10 h-10 text-sm' : 'w-10 h-10 text-sm'}`}>
              {getBrandInitials(branding?.storeName)}
            </div>
          )}
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold leading-tight text-slate-900" title={branding?.storeName || 'Cửa hàng'}>
                {branding?.storeName || 'Cửa hàng'}
              </p>
            </div>
          )}
        </div>
      
      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-6">
        {menuGroups.map((group, groupIdx) => {
          const visibleItems = group.items.filter(item => {
            switch (item.id) {
              case 'users':
              case 'activity-logs':
              case 'ai-insights':
              case 'master-data':
                return isAdminOrOwner;
              case 'inventory-ops':
              case 'alerts':
                return !isSalesStaff; // Warehouse, Admin, Owner can see
              case 'sales':
                return !isWarehouseStaff; // Sales, Admin, Owner can see
              case 'reports':
                return isAdminOrOwner;
              default:
                return true;
            }
          });
          if (visibleItems.length === 0) return null;

          return (
            <div key={groupIdx} className={`flex flex-col ${isCollapsed ? 'px-2' : 'px-3'}`}>
              {!isCollapsed ? (
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-3 mb-2 mt-1">
                  {group.title}
                </h3>
              ) : (
                <div className="h-px bg-slate-100 my-2 mx-2"></div>
              )}
              <div className="flex flex-col gap-1">
                {visibleItems.map(item => {
                  if (!item.children) {
                    const Icon = item.icon;
                    const isActive = isItemActive(item.id);
                    return (
                      <a 
                        key={item.id} 
                        href="#" 
                        title={isCollapsed ? item.label : undefined}
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate(item.id);
                          if (window.innerWidth < 1024 && typeof setIsOpen === 'function') {
                            setIsOpen(false);
                          }
                        }}
                        className={`flex items-center transition-colors ${
                          isCollapsed 
                            ? `justify-center w-10 h-10 mx-auto rounded-xl ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`
                            : `gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                        {!isCollapsed && <span className="flex-1">{item.label}</span>}
                        {!isCollapsed && isActive && (
                          <div className="absolute left-0 w-1 h-8 bg-blue-600 rounded-r-full"></div>
                        )}
                      </a>
                    );
                  } else {
                    const GroupIcon = item.icon;
                    const isExpanded = expandedGroups[item.id] && !isCollapsed;
                    const hasActiveChild = item.children.some(child => isItemActive(child.id));
                    
                    return (
                      <div key={item.id} className="flex flex-col relative">
                        <button
                          title={isCollapsed ? item.label : undefined}
                          onClick={() => toggleGroup(item.id)}
                          className={`flex items-center transition-colors ${
                            isCollapsed
                              ? `justify-center w-10 h-10 mx-auto rounded-xl ${hasActiveChild ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`
                              : `gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-left ${hasActiveChild && !isExpanded ? 'text-blue-700 bg-slate-50' : 'text-slate-700 hover:bg-slate-50'}`
                          }`}
                        >
                          <GroupIcon className={`w-5 h-5 ${hasActiveChild ? 'text-blue-600' : 'text-slate-400'}`} />
                          {!isCollapsed && <span className="flex-1">{item.label}</span>}
                          {!isCollapsed && <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />}
                        </button>
                        
                        {isExpanded && !isCollapsed && (
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
                                    if (window.innerWidth < 1024 && typeof setIsOpen === 'function') {
                                      setIsOpen(false);
                                    }
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

      {/* Toggle Collapse Button (Desktop) - Bottom */}
      <div className="border-t border-gray-100 p-3 hidden lg:block shrink-0">
        <button 
          onClick={toggleCollapse} 
          className={`flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors ${
            isCollapsed ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 py-2.5 w-full'
          }`}
          title={isCollapsed ? "Mở rộng" : undefined}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!isCollapsed && <span className="flex-1 text-left">Thu gọn</span>}
        </button>
      </div>

      </aside>
    </>
  );
}
