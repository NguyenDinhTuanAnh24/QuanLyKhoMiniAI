import React from 'react';
import { FilterBarSkeleton, CardListSkeleton } from '../ui/Skeletons';

export default function NotificationsSkeleton() {
  return (
    <div data-testid="notifications-skeleton" className="space-y-6 w-full max-w-4xl mx-auto animate-in fade-in duration-300">
      <FilterBarSkeleton />
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 sm:p-6">
        <CardListSkeleton count={6} />
      </div>
    </div>
  );
}
