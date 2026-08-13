import React from 'react';
import { StatCardSkeleton, ChartSkeleton, TableSkeleton, Skeleton, FilterBarSkeleton } from '../ui/Skeletons';

export default function ReportsSkeleton() {
  return (
    <div data-testid="reports-skeleton" className="space-y-6 w-full animate-in fade-in duration-300">
      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex space-x-6">
          <Skeleton className="w-24 h-8 mb-2" />
          <Skeleton className="w-24 h-8 mb-2" />
          <Skeleton className="w-24 h-8 mb-2" />
          <Skeleton className="w-24 h-8 mb-2 hidden sm:block" />
        </div>
      </div>

      <FilterBarSkeleton />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Chart */}
      <ChartSkeleton height="h-[400px]" />

      {/* Table */}
      <div className="hidden md:block">
        <TableSkeleton rows={5} showToolbar={false} />
      </div>
    </div>
  );
}
