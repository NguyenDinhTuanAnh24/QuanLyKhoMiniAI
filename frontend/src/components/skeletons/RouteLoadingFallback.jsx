import React from 'react';
import { useLocation } from 'react-router-dom';

import DashboardSkeleton from './DashboardSkeleton';
import ProductSkeleton from './ProductSkeleton';
import InventorySkeleton from './InventorySkeleton';
import SalesSkeleton from './SalesSkeleton';
import AlertsSkeleton from './AlertsSkeleton';
import AIInsightsSkeleton from './AIInsightsSkeleton';
import ReportsSkeleton from './ReportsSkeleton';
import ActivityLogsSkeleton from './ActivityLogsSkeleton';
import UsersSkeleton from './UsersSkeleton';
import SettingsSkeleton from './SettingsSkeleton';
import DataFoundationSkeleton from './DataFoundationSkeleton';
import NotificationsSkeleton from './NotificationsSkeleton';

export default function RouteLoadingFallback() {
  const location = useLocation();
  const path = location.pathname.split('/')[1] || 'dashboard';

  switch (path) {
    case 'dashboard':
      return <DashboardSkeleton />;
    case 'products':
      return <ProductSkeleton />;
    case 'inventory-ops':
    case 'warehouse':
    case 'stock':
    case 'import':
    case 'export':
      return <InventorySkeleton />;
    case 'sales':
      return <SalesSkeleton />;
    case 'alerts':
      return <AlertsSkeleton />;
    case 'ai-insights':
      return <AIInsightsSkeleton />;
    case 'reports':
      return <ReportsSkeleton />;
    case 'activity-logs':
      return <ActivityLogsSkeleton />;
    case 'users':
      return <UsersSkeleton />;
    case 'settings':
      return <SettingsSkeleton />;
    case 'categories':
      return <DataFoundationSkeleton title="Danh mục sản phẩm" subtitle="Tổ chức sản phẩm theo từng nhóm hàng hóa" />;
    case 'units':
      return <DataFoundationSkeleton title="Đơn vị tính" subtitle="Quản lý các đơn vị đo lường cho sản phẩm" />;
    case 'suppliers':
      return <DataFoundationSkeleton title="Nhà cung cấp" subtitle="Quản lý thông tin các đối tác cung cấp hàng hóa" />;
    case 'notifications':
      return <NotificationsSkeleton />;
    default:
      return <DashboardSkeleton />; // generic fallback
  }
}
