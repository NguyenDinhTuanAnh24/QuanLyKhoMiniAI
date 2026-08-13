import React from 'react';
import { Skeleton, TableSkeleton, FilterBarSkeleton, CardListSkeleton } from '../ui/Skeletons';

export default function ActivityLogsSkeleton() {
  return (
    <div data-testid="activity-log-skeleton" aria-busy="true" className="space-y-6 w-full">
      <FilterBarSkeleton />

      {/* Table Skeleton (Desktop) */}
      <div className="hidden md:block">
        <TableSkeleton rows={8} showToolbar={false} />
      </div>
      
      {/* List Skeleton (Mobile) */}
      <div className="md:hidden">
        <CardListSkeleton count={6} />
      </div>
    </div>
  );
}
