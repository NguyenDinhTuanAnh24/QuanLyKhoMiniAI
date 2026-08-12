import React from 'react';
import { Lightbulb, ArrowRight, CheckCircle2, AlertTriangle, AlertCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const asText = (value, fallback = '') => {
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }
  return fallback;
};

export default function AIRecommendedActions({ actions, onApplyAll, bulkPlanId, canCreatePlan, hasRunId }) {
  const navigate = useNavigate();

  const getActionIcon = (priority) => {
    switch(priority) {
      case 'HIGH': return <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />;
      case 'MEDIUM': return <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />;
      case 'LOW': 
      default: return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm h-full flex flex-col">
      <div className="p-5 md:p-6 border-b border-slate-100 flex items-center gap-2 bg-slate-50 rounded-t-xl shrink-0">
        <Lightbulb className="w-5 h-5 text-amber-500" />
        <h3 className="text-base font-bold text-slate-900">Hành động đề xuất</h3>
      </div>
      
      <div className="p-5 md:p-6 flex-1 flex flex-col justify-between gap-5 overflow-y-auto">
        {actions && actions.length > 0 ? (
          <ul className="space-y-5">
            {actions.map((action, idx) => {
              const title = typeof action === 'string' ? action : (action.title || action.label);
              const priority = action.priority || 'LOW';
              return (
                <li key={idx} className="flex items-start gap-3">
                  {getActionIcon(priority)}
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-800 leading-snug">
                      {asText(title)}
                    </span>
                    {typeof action === 'object' && action.description && (
                      <span className="text-xs text-slate-600 mt-1 leading-relaxed">{asText(action.description)}</span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="text-slate-500 text-sm text-center py-4 italic">
            Không có hành động khẩn cấp nào.
          </div>
        )}
        
        {bulkPlanId ? (
          <div className="flex gap-2 mt-auto">
            <button 
              disabled
              className="flex-1 py-2.5 bg-slate-100 text-emerald-600 text-sm font-medium rounded-lg flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Đã tạo kế hoạch</span>
            </button>
            <button
              onClick={() => navigate(`/inventory-ops?tab=import&planId=${bulkPlanId}`)}
              className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              title="Xem kế hoạch nhập kho"
            >
              <span>Xem kế hoạch</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button 
            onClick={onApplyAll}
            disabled={!canCreatePlan}
            title={!hasRunId ? "Chưa có phiên phân tích được lưu" : !canCreatePlan ? "Không có gợi ý nhập hợp lệ" : ""}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 mt-auto"
          >
            <span>Tạo kế hoạch nhập từ AI</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
