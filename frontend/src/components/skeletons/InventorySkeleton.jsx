import React from 'react';
import { StatCardSkeleton, Skeleton, TableSkeleton } from '../ui/Skeletons';

export default function InventorySkeleton() {
  return (
    <div data-testid="inventory-skeleton" aria-busy="true" className="space-y-6 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Form area */}
        <div className="flex-1 space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <Skeleton className="w-48 h-6 mb-4" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1">
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-full h-10" />
              </div>
              <div className="space-y-1">
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-full h-10" />
              </div>
              <div className="md:col-span-2 space-y-1">
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-full h-10" />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
              <Skeleton className="w-40 h-5" />
              <div className="flex flex-col md:flex-row gap-3 items-end">
                <div className="flex-1 w-full space-y-1">
                  <Skeleton className="w-20 h-4" />
                  <Skeleton className="w-full h-10" />
                </div>
                <div className="w-full md:w-24 space-y-1">
                  <Skeleton className="w-20 h-4" />
                  <Skeleton className="w-full h-10" />
                </div>
                <div className="w-full md:w-32 space-y-1">
                  <Skeleton className="w-24 h-4" />
                  <Skeleton className="w-full h-10" />
                </div>
                <Skeleton className="w-24 h-10 hidden md:block" />
              </div>
            </div>

            <div className="mt-4">
              <TableSkeleton rows={3} showToolbar={false} />
            </div>

            <div className="mt-4 flex justify-end">
              <Skeleton className="w-32 h-10" />
            </div>
          </div>
        </div>

        {/* History Sidebar */}
        <div className="w-full lg:w-96">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 sticky top-4">
            <Skeleton className="w-48 h-6 mb-4" />
            <Skeleton className="w-full h-10 mb-4" />
            
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-3 border border-slate-100 rounded-lg">
                  <div className="flex justify-between mb-1">
                    <Skeleton className="w-32 h-4" />
                    <Skeleton className="w-16 h-4" />
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <Skeleton className="w-24 h-3" />
                    <Skeleton className="w-20 h-5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
