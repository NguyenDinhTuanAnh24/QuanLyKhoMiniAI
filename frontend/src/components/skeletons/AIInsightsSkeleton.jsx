import React from 'react';
import { Skeleton, TableSkeleton } from '../ui/Skeletons';

export default function AIInsightsSkeleton() {
  return (
    <div data-testid="ai-skeleton" aria-busy="true" className="space-y-6 w-full">
      {/* AI Overview Panel */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100/50 relative overflow-hidden">
        <Skeleton className="w-32 h-6 mb-4" />
        <div className="space-y-2 mb-6 w-full max-w-3xl">
          <Skeleton className="w-full h-4" />
          <Skeleton className="w-5/6 h-4" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/60 p-4 rounded-xl border border-white/40">
            <Skeleton className="w-24 h-5 mb-3" />
            <div className="space-y-2"><Skeleton className="w-full h-4" /><Skeleton className="w-3/4 h-4" /></div>
          </div>
          <div className="bg-white/60 p-4 rounded-xl border border-white/40">
            <Skeleton className="w-24 h-5 mb-3" />
            <div className="space-y-2"><Skeleton className="w-full h-4" /><Skeleton className="w-3/4 h-4" /></div>
          </div>
          <div className="bg-white/60 p-4 rounded-xl border border-white/40">
            <Skeleton className="w-24 h-5 mb-3" />
            <div className="space-y-2"><Skeleton className="w-full h-4" /><Skeleton className="w-3/4 h-4" /></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex space-x-6">
          <Skeleton className="w-24 h-8 mb-2" />
          <Skeleton className="w-24 h-8 mb-2" />
          <Skeleton className="w-24 h-8 mb-2" />
          <Skeleton className="w-24 h-8 mb-2 hidden sm:block" />
          <Skeleton className="w-24 h-8 mb-2 hidden sm:block" />
        </div>
      </div>

      {/* Urgent List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
        <Skeleton className="w-48 h-6 mb-2" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-4 p-4 border border-slate-100 rounded-lg">
              <div className="flex-1 space-y-2">
                <Skeleton className="w-48 h-5" />
                <Skeleton className="w-32 h-4" />
              </div>
              <div className="flex flex-wrap gap-4 items-center">
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-32 h-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <Skeleton className="w-48 h-6 mb-6" />
          <Skeleton className="w-full h-[300px] rounded-lg" />
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <Skeleton className="w-48 h-6 mb-6" />
          <div className="space-y-4">
            <Skeleton className="w-full h-[80px] rounded-lg" />
            <Skeleton className="w-full h-[80px] rounded-lg" />
            <Skeleton className="w-full h-[80px] rounded-lg" />
          </div>
        </div>
      </div>

      {/* Table Detail */}
      <div className="hidden md:block">
        <TableSkeleton rows={5} showToolbar={true} />
      </div>
    </div>
  );
}
