import React from 'react';
import { TableSkeleton, FilterBarSkeleton, CardListSkeleton, Skeleton } from '../ui/Skeletons';
import PageContainer from '../layout/PageContainer';

export default function DataFoundationSkeleton({ title = "Đang tải...", subtitle = "Vui lòng đợi trong giây lát" }) {
  return (
    <PageContainer className="animate-in fade-in duration-300" data-testid="data-foundation-skeleton">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
           <Skeleton className="w-32 h-10 rounded-lg" />
        </div>
      </div>
      <FilterBarSkeleton />

      <div className="hidden md:block">
        <TableSkeleton rows={8} showToolbar={false} />
      </div>
      
      <div className="md:hidden">
        <CardListSkeleton count={8} />
      </div>
    </PageContainer>
  );
}
