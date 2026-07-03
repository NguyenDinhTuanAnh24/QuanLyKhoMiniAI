import React from 'react';
import { PackageSearch, ArrowRight, Zap } from 'lucide-react';

export default function AISuggestionCards({ items, onApplySuggestion }) {
  const suggestions = items.filter(i => i.suggested_import_quantity > 0)
                           .sort((a, b) => b.suggested_import_quantity - a.suggested_import_quantity);

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-indigo-500" />
        <h3 className="text-lg font-bold text-slate-900">Gợi ý nhập hàng từ AI</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {suggestions.map((item) => (
          <div key={item.product_id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-blue-300 transition-colors flex flex-col h-full">
            <div className="flex justify-between items-start mb-3 gap-2">
              <h4 className="font-bold text-slate-900 text-sm leading-tight line-clamp-2" title={item.product_name}>
                {item.product_name}
              </h4>
              <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded-md text-sm shrink-0">
                +{item.suggested_import_quantity}
              </span>
            </div>
            
            <p className="text-xs text-slate-600 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex-1">
              <span className="font-semibold text-slate-700 block mb-1">Lý do:</span>
              {item.ai_reason}
            </p>
            
            <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
              {item.supplier_name ? (
                <div className="text-xs text-slate-500 flex items-center gap-1 max-w-[50%] truncate">
                  <PackageSearch className="w-3 h-3 shrink-0" />
                  <span className="truncate" title={item.supplier_name}>{item.supplier_name}</span>
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic">Chưa rõ NCC</div>
              )}
              
              <button 
                onClick={() => onApplySuggestion(item)}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-xs rounded-md transition-colors flex items-center gap-1"
              >
                <span>Áp dụng</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
