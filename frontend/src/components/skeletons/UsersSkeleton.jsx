import React from 'react';
import { Skeleton, TableSkeleton, FilterBarSkeleton, CardListSkeleton } from '../ui/Skeletons';

export default function UsersSkeleton() {
  return (
    <div data-testid="users-skeleton" className="space-y-6 w-full animate-in fade-in duration-300">
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
