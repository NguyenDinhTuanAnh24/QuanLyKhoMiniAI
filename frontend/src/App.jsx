import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import ProductDashboard from './components/ProductDashboard';
import CategoryDashboard from './components/CategoryDashboard';
import UnitDashboard from './components/UnitDashboard';
import SupplierDashboard from './components/SupplierDashboard';
import ProductFormPage from './components/ProductFormPage';
import MainLayout from './components/MainLayout';
import SalesPage from './pages/SalesPage';
import InventoryOpsDashboard from './components/InventoryOpsDashboard';
import LowStockAlertDashboard from './components/LowStockAlertDashboard';
import AIInsightsPage from './pages/AIInsightsPage';
import DashboardPage from './pages/DashboardPage';
import ReportsPage from './pages/ReportsPage';
import UserDashboard from './pages/UserDashboard';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import ActivityLogsPage from './pages/ActivityLogsPage';
import { ToastProvider } from './contexts/ToastContext';
import RoleProtectedRoute from './components/RoleProtectedRoute';


import { isAuthenticated } from './services/authService';

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
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout activePage={activePage} onNavigate={handleNavigate}>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage onNavigate={handleNavigate} />} />
                  
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
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </ToastProvider>
  );
}

export default App;
