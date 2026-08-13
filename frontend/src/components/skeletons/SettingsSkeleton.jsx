import React from 'react';
import { Skeleton, FormFieldSkeleton } from '../ui/Skeletons';

export default function SettingsSkeleton() {
  return (
    <div data-testid="settings-skeleton" aria-busy="true" className="space-y-6 w-full">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Tabs Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 space-y-1">
            <Skeleton className="w-full h-10 rounded-lg bg-blue-50/50" />
            <Skeleton className="w-full h-10 rounded-lg" />
            <Skeleton className="w-full h-10 rounded-lg" />
            <Skeleton className="w-full h-10 rounded-lg" />
            <Skeleton className="w-full h-10 rounded-lg" />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <Skeleton className="w-48 h-6 mb-1" />
              <Skeleton className="w-64 h-4" />
            </div>
            
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Form fields */}
                <div className="flex-1 space-y-5">
                  <div className="flex items-center gap-4 mb-6">
                    <Skeleton className="w-20 h-20 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="w-32 h-8 rounded-lg" />
                      <Skeleton className="w-48 h-4" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormFieldSkeleton />
                    <FormFieldSkeleton />
                  </div>
                  <FormFieldSkeleton />
                  <FormFieldSkeleton />
                </div>
                
                {/* Right Summary Card (if present on some tabs) */}
                <div className="w-full lg:w-[300px]">
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                    <Skeleton className="w-32 h-5" />
                    <Skeleton className="w-full h-4" />
                    <Skeleton className="w-5/6 h-4" />
                    <Skeleton className="w-full h-4" />
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3 pt-5 border-t border-slate-100">
                <Skeleton className="w-24 h-10 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
