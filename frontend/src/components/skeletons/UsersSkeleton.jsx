import React from 'react';
import { StatCardSkeleton, TableSkeleton, FilterBarSkeleton, CardListSkeleton } from '../ui/Skeletons';

export default function UsersSkeleton() {
  return (
    <div data-testid="users-skeleton" aria-busy="true" aria-label="Đang tải dữ liệu" className="space-y-6 w-full">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <FilterBarSkeleton />

      {/* Table Skeleton (Desktop) */}
      <div className="hidden md:block">
        <TableSkeleton rows={6} showToolbar={false} />
      </div>
      
      {/* List Skeleton (Mobile) */}
      <div className="md:hidden">
        <CardListSkeleton count={5} />
      </div>
    </div>
  );
}
