import React from 'react';
import { Skeleton, TableSkeleton } from '../ui/Skeletons';

export default function SalesSkeleton() {
  return (
    <div data-testid="sales-skeleton" className="space-y-6 w-full animate-in fade-in duration-300">
      <div className="flex flex-col lg:flex-row gap-6">
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
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
              <Skeleton className="w-40 h-5" />
              <div className="flex flex-col md:flex-row gap-3">
                <Skeleton className="flex-1 h-10" />
                <Skeleton className="w-full md:w-32 h-10" />
                <Skeleton className="w-24 h-10 hidden md:block" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <Skeleton className="w-32 h-6" />
              <Skeleton className="w-24 h-8" />
            </div>
            <TableSkeleton rows={4} showToolbar={false} />
          </div>
        </div>

        <div className="w-full lg:w-[400px]">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 sticky top-4 overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <Skeleton className="w-32 h-6 mb-1" />
              <Skeleton className="w-48 h-4" />
            </div>
            <div className="p-5 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between"><Skeleton className="w-20 h-4" /><Skeleton className="w-16 h-4" /></div>
                <div className="flex justify-between"><Skeleton className="w-20 h-4" /><Skeleton className="w-16 h-4" /></div>
                <div className="flex justify-between pt-3 border-t border-slate-100"><Skeleton className="w-24 h-5" /><Skeleton className="w-24 h-6" /></div>
              </div>

              <div className="space-y-4">
                <Skeleton className="w-full h-10" />
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="w-full h-12" />
                  <Skeleton className="w-full h-12" />
                </div>
              </div>
              
              <Skeleton className="w-full h-12" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
