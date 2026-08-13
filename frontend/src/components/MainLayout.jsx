import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function MainLayout({ children, activePage, activePayload, onNavigate }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile Drawer
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('smart-retail-sidebar-collapsed') === 'true';
  });
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('smart-retail-sidebar-collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar 
        activePage={activePage} 
        onNavigate={onNavigate} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
      />
      <div 
        className={`flex-1 flex flex-col w-full min-w-0 transition-[margin-left] duration-300 ease-in-out ${
          isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-60'
        }`}
      >
        <Topbar activePage={activePage} activePayload={activePayload} onNavigate={onNavigate} toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto w-full min-w-0 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
