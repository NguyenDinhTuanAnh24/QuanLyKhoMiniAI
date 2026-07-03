import React from 'react';
import { ShoppingCart } from 'lucide-react';

export default function AIRestockSuggestions({ suggestions }) {
  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 'Cao': return 'bg-red-100 text-red-700';
      case 'Trung bình': return 'bg-yellow-100 text-yellow-700';
      case 'Thấp': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm h-full flex flex-col">
      <div className="p-5 border-b border-slate-100 flex items-center gap-2 bg-slate-50 rounded-t-xl">
        <ShoppingCart className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-bold text-slate-900">Gợi ý đặt hàng</h3>
      </div>
      
      <div className="p-0 flex-1 overflow-auto custom-scrollbar">
        {suggestions && suggestions.length > 0 ? (
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-white sticky top-0 border-b border-slate-100">
              <tr className="text-slate-500 font-medium">
                <th className="py-3 px-4">Sản phẩm</th>
                <th className="py-3 px-4 text-center">Tồn</th>
                <th className="py-3 px-4 text-center">Dự báo</th>
                <th className="py-3 px-4 text-center">Nên nhập</th>
                <th className="py-3 px-4 text-center">Ưu tiên</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suggestions.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-800">
                    <div className="truncate max-w-[120px]" title={item.product_name}>
                      {item.product_name}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600">{item.stock}</td>
                  <td className="py-3 px-4 text-center font-medium text-indigo-600">{item.forecast}</td>
                  <td className="py-3 px-4 text-center font-bold text-red-600">+{item.suggested}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getPriorityBadge(item.priority)}`}>
                      {item.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <p>Không có gợi ý đặt hàng khẩn cấp.</p>
          </div>
        )}
      </div>
    </div>
  );
}
