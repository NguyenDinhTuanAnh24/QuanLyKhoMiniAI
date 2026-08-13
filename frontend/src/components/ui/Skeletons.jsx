import React from 'react';

export const StatCardSkeleton = () => (
  <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-3 h-[120px]">
    <div className="flex justify-between items-start">
      <div className="w-10 h-10 rounded-lg bg-slate-200 animate-pulse"></div>
      <div className="w-16 h-6 rounded-md bg-slate-200 animate-pulse"></div>
    </div>
    <div>
      <div className="w-24 h-8 rounded bg-slate-200 animate-pulse mb-1"></div>
      <div className="w-32 h-4 rounded bg-slate-200 animate-pulse"></div>
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 6 }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden w-full">
    <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 items-center bg-slate-50">
      <div className="w-64 h-10 rounded-lg bg-slate-200 animate-pulse"></div>
      <div className="w-32 h-10 rounded-lg bg-slate-200 animate-pulse"></div>
      <div className="w-32 h-10 rounded-lg bg-slate-200 animate-pulse"></div>
      <div className="w-24 h-10 rounded-lg bg-slate-200 animate-pulse hidden md:block ml-auto"></div>
    </div>
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse min-w-[900px]">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {[...Array(6)].map((_, i) => (
              <th key={i} className="p-4"><div className="w-20 h-4 bg-slate-200 rounded animate-pulse"></div></th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {[...Array(rows)].map((_, r) => (
            <tr key={r}>
              {[...Array(6)].map((_, c) => (
                <td key={c} className="p-4"><div className={`h-4 bg-slate-200 rounded animate-pulse ${c === 0 ? 'w-8' : c === 1 ? 'w-48' : 'w-24'}`}></div></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const PageSkeleton = () => (
  <div data-testid="page-skeleton" className="space-y-6 w-full animate-in fade-in duration-300">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>
    <TableSkeleton />
  </div>
);

export const DashboardSkeleton = () => (
  <div data-testid="dashboard-skeleton" className="space-y-6 w-full animate-in fade-in duration-300">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 h-[350px] bg-white rounded-xl border border-slate-100 p-6 flex flex-col">
         <div className="w-48 h-6 bg-slate-200 rounded animate-pulse mb-2"></div>
         <div className="w-32 h-4 bg-slate-200 rounded animate-pulse mb-8"></div>
         <div className="flex-1 w-full bg-slate-100 rounded animate-pulse"></div>
      </div>
      <div className="h-[350px] bg-white rounded-xl border border-slate-100 p-6 flex flex-col">
         <div className="w-48 h-6 bg-slate-200 rounded animate-pulse mb-6"></div>
         <div className="space-y-4">
           <div className="w-full h-16 bg-slate-100 rounded animate-pulse"></div>
           <div className="w-full h-16 bg-slate-100 rounded animate-pulse"></div>
           <div className="w-full h-16 bg-slate-100 rounded animate-pulse"></div>
         </div>
      </div>
    </div>
  </div>
);
