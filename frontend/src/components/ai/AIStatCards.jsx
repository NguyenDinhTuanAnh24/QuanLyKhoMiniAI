import React from 'react';
import { PackagePlus, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

export default function AIStatCards({ summary }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
      {/* Nên nhập thêm */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 min-h-[92px] w-full flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
          <PackagePlus className="w-[20px] h-[20px]" />
        </div>
        <div>
          <p className="text-2xl font-semibold text-slate-900 leading-tight">
            {summary?.total_suggested_import_products || 0}
          </p>
          <p className="text-sm text-slate-500 mt-0.5">Nên nhập thêm</p>
        </div>
      </div>

      {/* Bán chạy */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 min-h-[92px] w-full flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
          <TrendingUp className="w-[20px] h-[20px]" />
        </div>
        <div>
          <p className="text-2xl font-semibold text-slate-900 leading-tight">
            {summary?.top_selling_products || 0}
          </p>
          <p className="text-sm text-slate-500 mt-0.5">Bán chạy</p>
        </div>
      </div>

      {/* Bán chậm */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 min-h-[92px] w-full flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-amber-50 text-amber-600">
          <TrendingDown className="w-[20px] h-[20px]" />
        </div>
        <div>
          <p className="text-2xl font-semibold text-slate-900 leading-tight">
            {summary?.slow_selling_products || 0}
          </p>
          <p className="text-sm text-slate-500 mt-0.5">Bán chậm</p>
        </div>
      </div>

      {/* Cảnh báo tồn kho */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 min-h-[92px] w-full flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-red-50 text-red-600">
          <AlertTriangle className="w-[20px] h-[20px]" />
        </div>
        <div>
          <p className="text-2xl font-semibold text-slate-900 leading-tight">
            {summary?.risk_products || 0}
          </p>
          <p className="text-sm text-slate-500 mt-0.5">Cảnh báo tồn kho</p>
        </div>
      </div>
    </div>
  );
}
