import React from 'react';

export default function StatCard({ label, value, trend, trendLabel, icon: Icon, iconColorClass = "bg-blue-50 text-blue-600", trendColorClass }) {
  const defaultTrendClass = trend === 'up' ? 'bg-green-50 text-green-700' : 
                            trend === 'down' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700';
                            
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-start gap-4">
      {Icon && (
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconColorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
      <div className="flex-1">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
          {trendLabel && (
            <span className={`text-xs font-semibold px-2 py-1 rounded-md ${trendColorClass || defaultTrendClass}`}>
              {trendLabel}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
      </div>
    </div>
  );
}
