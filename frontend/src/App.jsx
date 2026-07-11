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
import { ToastProvider } from './contexts/ToastContext';

import { getToken } from './services/authService';

const ProtectedRoute = ({ children }) => {
  const token = getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
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
                  <Route path="/categories" element={<CategoryDashboard onNavigate={handleNavigate} />} />
                  <Route path="/units" element={<UnitDashboard onNavigate={handleNavigate} />} />
                  <Route path="/suppliers" element={<SupplierDashboard onNavigate={handleNavigate} />} />
                  <Route path="/sales" element={<SalesPage onNavigate={handleNavigate} />} />
                  
                  {/* Inventory Ops Routes */}
                  <Route path="/inventory-ops" element={<InventoryOpsDashboard onNavigate={handleNavigate} />} />
                  <Route path="/warehouse" element={<Navigate to="/inventory-ops" replace />} />
                  <Route path="/stock" element={<Navigate to="/inventory-ops" replace />} />
                  <Route path="/import" element={<Navigate to="/inventory-ops" replace />} />
                  <Route path="/export" element={<Navigate to="/inventory-ops" replace />} />

                  {/* Placeholders for other main routes */}
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/ai-insights" element={<AIInsightsPage />} />
                  <Route path="/alerts" element={<LowStockAlertDashboard onNavigate={handleNavigate} />} />
                  <Route path="/users" element={<UserDashboard />} />
                  <Route path="/settings" element={<SettingsPage />} />

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
