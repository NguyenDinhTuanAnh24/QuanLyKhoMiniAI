import React from 'react';
import { StatCardSkeleton, TableSkeleton, FilterBarSkeleton, Skeleton } from '../ui/Skeletons';
import PageContainer from '../layout/PageContainer';

export default function AlertsSkeleton() {
  return (
    <PageContainer data-testid="alerts-skeleton" aria-busy="true">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cảnh báo tồn kho</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý các mặt hàng sắp hết hoặc cần nhập gấp</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <div className="bg-blue-50/50 rounded-xl p-4 flex items-center justify-between border border-blue-100/50">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-64 sm:w-96 h-4" />
        </div>
        <Skeleton className="w-24 h-4 hidden sm:block" />
      </div>

      <FilterBarSkeleton />

      {/* Table & Mobile List Skeleton */}
      <div className="hidden md:block">
        <TableSkeleton rows={8} showToolbar={false} />
      </div>
      
      {/* Mobile Card List Skeleton */}
      <div className="md:hidden flex flex-col gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-3">
            <div className="flex justify-between items-start gap-2">
               <Skeleton className="w-2/3 h-5" />
               <Skeleton className="w-16 h-5 rounded-full" />
            </div>
            <div className="space-y-2">
               <Skeleton className="w-1/2 h-4" />
               <Skeleton className="w-1/3 h-4" />
            </div>
            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <Skeleton className="flex-1 h-9 rounded-lg" />
              <Skeleton className="flex-1 h-9 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
