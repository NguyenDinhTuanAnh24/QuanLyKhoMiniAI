import React, { useState, useEffect } from 'react';
import { PackageSearch, ArrowRight, Zap, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
export default function AISuggestionCards({ data = [], onApplySuggestion }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 8;

  const paginateData = () => {
    setLoading(true);
    try {
      const filtered = data.filter(item => item.suggested_import_quantity > 0);
      setTotalItems(filtered.length);
      setTotalPages(Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1);

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const paginated = filtered.slice(from, from + ITEMS_PER_PAGE);
      setItems(paginated);
    } catch (error) {
      console.error('Lỗi khi xử lý dữ liệu thẻ gợi ý:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    paginateData();
  }, [data, currentPage]);

  if (!loading && items.length === 0) return null;

  return (
    <div className="mt-6 w-full min-w-0">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-blue-500" />
        <h3 className="font-bold text-slate-800 text-lg">Gợi ý nhập hàng từ AI</h3>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          <span className="ml-2 text-slate-500">Đang tải gợi ý...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item) => (
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
              {item.reason || 'Dựa trên dự báo AI và mức tồn kho.'}
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
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-slate-600">
            Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} trên tổng số {totalItems} thẻ
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white transition-colors"
              title="Trang trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-3 py-1 text-sm font-medium text-slate-700 flex items-center bg-white border border-slate-200 rounded-md shadow-sm">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white transition-colors"
              title="Trang sau"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
