import React from 'react';
import { Skeleton } from '../ui/Skeleton';
import { StatCardSkeleton, ChartSkeleton } from '../ui/Skeletons';

export default function DashboardSkeleton() {
  return (
    <div data-testid="dashboard-skeleton" aria-busy="true" aria-label="Đang tải dữ liệu" className="space-y-6 w-full">
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
          <Skeleton className="w-48 h-6 mb-6" />
          <div className="space-y-4">
            <Skeleton className="w-full h-16 rounded" />
            <Skeleton className="w-full h-16 rounded" />
            <Skeleton className="w-full h-16 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
