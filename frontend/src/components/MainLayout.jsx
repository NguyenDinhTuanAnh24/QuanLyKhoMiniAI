import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function MainLayout({ children, activePage, onNavigate }) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <div className="flex-1 flex flex-col ml-64 min-w-0">
        <Topbar activePage={activePage} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
