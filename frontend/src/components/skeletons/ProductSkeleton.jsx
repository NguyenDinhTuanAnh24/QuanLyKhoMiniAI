import React from 'react';
import { StatCardSkeleton, TableSkeleton, FilterBarSkeleton } from '../ui/Skeletons';

export default function ProductSkeleton() {
  return (
    <div data-testid="product-skeleton" className="space-y-6 w-full animate-in fade-in duration-300">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <FilterBarSkeleton />

      {/* Table & Mobile List Skeleton */}
      <div className="hidden md:block">
        <TableSkeleton rows={8} showToolbar={false} />
      </div>
      
      {/* Mobile Card List Skeleton */}
      <div className="md:hidden flex flex-col gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4">
            <div className="w-16 h-16 bg-slate-200 rounded-lg shrink-0 animate-pulse" />
            <div className="flex-1 space-y-2 py-1">
              <div className="w-3/4 h-4 bg-slate-200 rounded animate-pulse" />
              <div className="w-1/2 h-4 bg-slate-200 rounded animate-pulse" />
              <div className="w-1/3 h-4 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
