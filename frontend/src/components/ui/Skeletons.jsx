import React from 'react';

export const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-slate-200/80 rounded-md ${className}`} />
);

export const StatCardSkeleton = () => (
  <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-3 h-[120px]">
    <div className="flex justify-between items-start">
      <Skeleton className="w-10 h-10 rounded-lg" />
      <Skeleton className="w-16 h-6 rounded-md" />
    </div>
    <div>
      <Skeleton className="w-24 h-8 rounded mb-1" />
      <Skeleton className="w-32 h-4 rounded" />
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 6, showHeader = true, showToolbar = true }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden w-full">
    {showToolbar && (
      <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 items-center bg-slate-50">
        <Skeleton className="w-64 h-10 rounded-lg" />
        <Skeleton className="w-32 h-10 rounded-lg" />
        <Skeleton className="w-32 h-10 rounded-lg" />
        <Skeleton className="w-24 h-10 rounded-lg hidden md:block ml-auto" />
      </div>
    )}
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse min-w-[900px]">
        {showHeader && (
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {[...Array(6)].map((_, i) => (
                <th key={i} className="p-4"><Skeleton className="w-20 h-4" /></th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-slate-100">
          {[...Array(rows)].map((_, r) => (
            <tr key={r}>
              {[...Array(6)].map((_, c) => (
                <td key={c} className="p-4">
                  <Skeleton className={`h-4 ${c === 0 ? 'w-8' : c === 1 ? 'w-48' : 'w-24'}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const ChartSkeleton = ({ height = "h-[350px]" }) => (
  <div className={`bg-white rounded-xl border border-slate-100 p-6 flex flex-col ${height}`}>
    <Skeleton className="w-48 h-6 mb-2" />
    <Skeleton className="w-32 h-4 mb-8" />
    <Skeleton className="flex-1 w-full rounded" />
  </div>
);

export const FormFieldSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="w-24 h-4" />
    <Skeleton className="w-full h-10 rounded-lg" />
  </div>
);

export const FilterBarSkeleton = () => (
  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3">
    <Skeleton className="w-full md:w-64 h-10 rounded-lg" />
    <Skeleton className="w-full md:w-40 h-10 rounded-lg" />
    <Skeleton className="w-full md:w-40 h-10 rounded-lg" />
  </div>
);

export const CardListSkeleton = ({ count = 5 }) => (
  <div className="flex flex-col gap-4 w-full">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="w-3/4 h-5" />
          <Skeleton className="w-1/2 h-4" />
        </div>
        <Skeleton className="w-24 h-6 rounded-full shrink-0" />
      </div>
    ))}
  </div>
);
