import React from 'react';
import { Lightbulb, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function AIRecommendedActions({ actions, onApplyAll }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm h-full flex flex-col">
      <div className="p-5 border-b border-slate-100 flex items-center gap-2 bg-slate-50 rounded-t-xl">
        <Lightbulb className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-bold text-slate-900">Hành động đề xuất</h3>
      </div>
      
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        {actions && actions.length > 0 ? (
          <ul className="space-y-3">
            {actions.map((action, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-800 leading-snug">
                    {typeof action === 'string' ? action : action.label}
                  </span>
                  {typeof action === 'object' && action.description && (
                    <span className="text-xs text-slate-600 mt-1">{action.description}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-slate-500 text-sm text-center py-4">
            Không có hành động khẩn cấp nào.
          </div>
        )}
        
        <button 
          onClick={onApplyAll}
          disabled={!actions || actions.length === 0}
          className="w-full py-2.5 mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span>Áp dụng tất cả đề xuất</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
