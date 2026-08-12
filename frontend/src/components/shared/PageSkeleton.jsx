import React from 'react';

export default function PageSkeleton() {
  return (
    <div className="p-6 max-w-[1600px] mx-auto w-full animate-pulse">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="h-4 w-24 bg-slate-200 rounded mb-2"></div>
          <div className="h-8 w-48 bg-slate-200 rounded"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-32 bg-slate-200 rounded-lg"></div>
          <div className="h-10 w-10 bg-slate-200 rounded-lg"></div>
        </div>
      </div>

      {/* Grid of 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm h-28 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
              <div className="w-16 h-6 bg-slate-200 rounded-md"></div>
            </div>
            <div>
              <div className="h-6 w-24 bg-slate-200 rounded mt-3"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-6 h-80">
          <div className="h-6 w-48 bg-slate-200 rounded mb-6"></div>
          <div className="w-full h-full pb-8 flex items-end justify-between gap-4">
            {[...Array(7)].map((_, idx) => (
              <div key={idx} className="w-full bg-slate-100 rounded-t-sm" style={{ height: `${Math.max(20, Math.random() * 100)}%` }}></div>
            ))}
          </div>
        </div>
        
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-100 shadow-sm p-6 h-80 flex flex-col gap-4">
          <div className="h-6 w-32 bg-slate-200 rounded mb-2"></div>
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="w-full h-12 bg-slate-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
