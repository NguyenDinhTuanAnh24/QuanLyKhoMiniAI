import React from 'react';
import { Sparkles } from 'lucide-react';

export default function AIHeroBanner({ onRefresh, loading }) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-blue-50 border border-blue-100 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm shrink-0 border border-blue-50">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900">AI Insights</h2>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
              Powered by AI
            </span>
          </div>
          <p className="text-slate-600 text-sm">
            Phân tích dữ liệu bán hàng và dự báo nhu cầu nhập hàng thông minh.
          </p>
        </div>
      </div>
      
      <button 
        onClick={onRefresh}
        disabled={loading}
        className="px-4 py-2 border border-blue-200 bg-white hover:bg-blue-50 text-blue-700 font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        <Sparkles className="w-4 h-4" />
        <span>Phân tích mới</span>
      </button>
    </div>
  );
}
