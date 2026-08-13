import React, { useState, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

import MainLayout from './components/MainLayout';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import RouteLoadingFallback from './components/skeletons/RouteLoadingFallback';
import { ToastProvider } from './contexts/ToastContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { BrandingProvider } from './contexts/BrandingContext';

import LoginPage from './pages/LoginPage';
import { isAuthenticated } from './services/authService';

// Lazy load major pages and dashboards
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProductDashboard = lazy(() => import('./components/ProductDashboard'));
const CategoryDashboard = lazy(() => import('./components/CategoryDashboard'));
const UnitDashboard = lazy(() => import('./components/UnitDashboard'));
const SupplierDashboard = lazy(() => import('./components/SupplierDashboard'));
const SalesPage = lazy(() => import('./pages/SalesPage'));
const InventoryOpsDashboard = lazy(() => import('./components/InventoryOpsDashboard'));
const LowStockAlertDashboard = lazy(() => import('./components/LowStockAlertDashboard'));
const AIInsightsPage = lazy(() => import('./pages/AIInsightsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ActivityLogsPage = lazy(() => import('./pages/ActivityLogsPage'));
const Notifications = lazy(() => import('./pages/Notifications'));


const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const isAuth = isAuthenticated();
  
  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};


function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Define activePage based on current URL path
  const path = location.pathname.split('/')[1];
  const activePage = path || 'dashboard';

  const handleNavigate = (page, payload = null) => {
    navigate(`/${page}`);
    // payload would be passed via state if needed: navigate(`/${page}`, { state: payload })
  };

  return (
    <ToastProvider>
      <BrandingProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <NotificationProvider>
                <MainLayout activePage={activePage} onNavigate={handleNavigate}>
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<DashboardPage onNavigate={handleNavigate} />} />
                      <Route path="/notifications" element={<Notifications />} />
                    
                    <Route path="/products" element={<ProductDashboard onNavigate={handleNavigate} />} />
                    <Route path="/categories" element={
                      <RoleProtectedRoute allowedRoles={['ADMIN', 'OWNER']}>
                        <CategoryDashboard onNavigate={handleNavigate} />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/units" element={
                      <RoleProtectedRoute allowedRoles={['ADMIN', 'OWNER']}>
                        <UnitDashboard onNavigate={handleNavigate} />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/suppliers" element={
                      <RoleProtectedRoute allowedRoles={['ADMIN', 'OWNER']}>
                        <SupplierDashboard onNavigate={handleNavigate} />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/sales" element={
                      <RoleProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'SALES_STAFF']}>
                        <SalesPage onNavigate={handleNavigate} />
                      </RoleProtectedRoute>
                    } />
                    
                    {/* Inventory Ops Routes */}
                    <Route path="/inventory-ops" element={
                      <RoleProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'WAREHOUSE_STAFF']}>
                        <InventoryOpsDashboard onNavigate={handleNavigate} />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/warehouse" element={<Navigate to="/inventory-ops" replace />} />
                    <Route path="/stock" element={<Navigate to="/inventory-ops" replace />} />
                    <Route path="/import" element={<Navigate to="/inventory-ops" replace />} />
                    <Route path="/export" element={<Navigate to="/inventory-ops" replace />} />

                    {/* Placeholders for other main routes */}
                    <Route path="/reports" element={
                      <RoleProtectedRoute allowedRoles={['ADMIN', 'OWNER']}>
                        <ReportsPage />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/ai-insights" element={
                      <RoleProtectedRoute allowedRoles={['ADMIN', 'OWNER']}>
                        <AIInsightsPage />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/alerts" element={
                      <RoleProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'WAREHOUSE_STAFF']}>
                        <LowStockAlertDashboard onNavigate={handleNavigate} />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/users" element={
                      <RoleProtectedRoute allowedRoles={['ADMIN', 'OWNER']}>
                        <UserDashboard />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/settings" element={
                      <RoleProtectedRoute allowedRoles={['ADMIN', 'OWNER']}>
                        <SettingsPage />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/activity-logs" element={
                      <RoleProtectedRoute allowedRoles={['ADMIN', 'OWNER']}>
                        <ActivityLogsPage />
                      </RoleProtectedRoute>
                    } />

                    {/* Default fallback for undefined routes */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                  </Suspense>
              </MainLayout>
              </NotificationProvider>
            </ProtectedRoute>
          }
        />
      </Routes>
      </BrandingProvider>
    </ToastProvider>
  );
}

export default App;
