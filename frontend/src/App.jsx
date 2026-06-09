import React, { useState } from 'react';
import ProductDashboard from './components/ProductDashboard';
import CategoryDashboard from './components/CategoryDashboard';
import UnitDashboard from './components/UnitDashboard';
import SupplierDashboard from './components/SupplierDashboard';
import ProductFormPage from './components/ProductFormPage';
import MainLayout from './components/MainLayout';
import SalesPage from './pages/SalesPage';

function App() {
  const [activePage, setActivePage] = useState('products');
  const [activePayload, setActivePayload] = useState(null);

  const handleNavigate = (page, payload = null) => {
    setActivePage(page);
    setActivePayload(payload);
  };

  const renderContent = () => {
    switch (activePage) {
      case 'products': return <ProductDashboard onNavigate={handleNavigate} />;
      case 'product-form': return <ProductFormPage payload={activePayload} onNavigate={handleNavigate} />;
      case 'categories': return <CategoryDashboard onNavigate={handleNavigate} />;
      case 'units': return <UnitDashboard onNavigate={handleNavigate} />;
      case 'suppliers': return <SupplierDashboard onNavigate={handleNavigate} />;
      case 'sales': return <SalesPage onNavigate={handleNavigate} />;
      default: return <ProductDashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <MainLayout activePage={activePage} onNavigate={handleNavigate}>
      {renderContent()}
    </MainLayout>
  );
}

export default App;
