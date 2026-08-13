import React from 'react';
import { StatCardSkeleton, ChartSkeleton } from '../ui/Skeletons';

export default function DashboardSkeleton() {
  return (
    <div data-testid="dashboard-skeleton" className="space-y-6 w-full animate-in fade-in duration-300">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2">
          <ChartSkeleton height="h-[400px]" />
        </div>
        {/* AI Panel */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 h-[400px] flex flex-col">
          <div className="w-48 h-6 bg-slate-200 rounded animate-pulse mb-6" />
          <div className="space-y-4">
            <div className="w-full h-16 bg-slate-100 rounded animate-pulse" />
            <div className="w-full h-16 bg-slate-100 rounded animate-pulse" />
            <div className="w-full h-16 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
