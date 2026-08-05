import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function MainLayout({ children, activePage, activePayload, onNavigate }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar activePage={activePage} onNavigate={onNavigate} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col lg:ml-64 w-full min-w-0">
        <Topbar activePage={activePage} activePayload={activePayload} onNavigate={onNavigate} toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
