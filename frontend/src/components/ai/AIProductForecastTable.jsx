import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCcw, ArrowRight, Eye, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
export default function AIProductForecastTable({ categories, data = [], onApplySuggestion }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const filterAndPaginateData = () => {
    setLoading(true);
    try {
      let filtered = [...data];

      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        filtered = filtered.filter(item => 
          item.product_name?.toLowerCase().includes(lowerSearch) || 
          item.sku?.toLowerCase().includes(lowerSearch)
        );
      }

      if (selectedCategory) {
        const cat = categories.find(c => String(c.category_id) === String(selectedCategory));
        if (cat) {
          filtered = filtered.filter(item => item.category_name === cat.category_name);
        }
      }

      if (selectedRisk && selectedRisk !== 'all') {
        filtered = filtered.filter(item => {
          // Map priority to risk labels for filtering
          const riskLabel = item.priority === 'Cao' ? 'Hết hàng' : (item.priority === 'Trung bình' ? 'Cần nhập' : 'Ổn định');
          // For simplicity, just check if priority matches logic
          if (selectedRisk === 'Hết hàng') return item.priority === 'Cao';
          if (selectedRisk === 'Cần nhập' || selectedRisk === 'Rủi ro cao') return item.priority === 'Trung bình';
          if (selectedRisk === 'Ổn định') return item.priority === 'Thấp';
          return true;
        });
      }

      setTotalItems(filtered.length);
      setTotalPages(Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1);

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const paginated = filtered.slice(from, from + ITEMS_PER_PAGE);
      setItems(paginated);
    } catch (error) {
      console.error('Lỗi khi xử lý dữ liệu bảng:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterAndPaginateData();
  }, [data, currentPage, searchTerm, selectedCategory, selectedRisk]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedRisk]);

  const getPriorityBadgeClass = (priority) => {
    switch(priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'MEDIUM': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'LOW': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-500" title="Tăng" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-500" title="Giảm" />;
    return <Minus className="w-4 h-4 text-slate-400" title="Ổn định" />;
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedRisk('');
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col w-full min-w-0">
      {/* Filters */}
      <div className="p-5 flex flex-col sm:flex-row gap-4 bg-white mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tên sản phẩm hoặc SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white h-10"
          />
        </div>
        <div className="flex gap-3">
          <div className="relative w-40">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none truncate h-10"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c, i) => (
                <option key={i} value={c.category_id}>{c.category_name}</option>
              ))}
            </select>
          </div>
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="w-36 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white h-10"
          >
            <option value="">Trạng thái</option>
            <option value="Hết hàng">Hết hàng</option>
            <option value="Rủi ro cao">Rủi ro cao</option>
            <option value="Cần nhập">Cần nhập</option>
            <option value="Ổn định">Ổn định</option>
          </select>
          <button 
            onClick={resetFilters}
            className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors h-10 w-10 flex items-center justify-center"
            title="Đặt lại bộ lọc"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
              <th className="p-4 font-semibold">Sản phẩm</th>
              <th className="p-4 font-semibold text-center">Tồn kho</th>
              <th className="p-4 font-semibold text-center">Mức an toàn</th>
              <th className="p-4 font-semibold text-center">TB/ngày</th>
              <th className="p-4 font-semibold text-center">Dự báo</th>
              <th className="p-4 font-semibold text-center">Gợi ý kho</th>
              <th className="p-4 font-semibold text-center">Ưu tiên</th>
              <th className="p-4 font-semibold text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-500">Đang tải dữ liệu...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-500">
                  Không tìm thấy sản phẩm phù hợp.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.product_id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-slate-900">{item.product_name}</div>
                    <div className="text-xs text-slate-500">{item.sku} • {item.category_name}</div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`font-semibold ${item.stock_quantity <= item.reorder_level ? 'text-red-600' : 'text-slate-700'}`}>
                      {item.stock_quantity ?? 0}
                    </span>
                  </td>
                  <td className="p-4 text-center font-medium text-slate-700">{item.reorder_level ?? 0}</td>
                  <td className="p-4 text-center font-medium text-slate-700">{item.avg_daily_sales_90d ?? item.avg_daily_sales ?? 0}</td>
                  <td className="p-4 text-center font-medium text-slate-700">{item.forecast_quantity ?? item.forecast_14d ?? 0}</td>
                  <td className="p-4 text-center font-bold">
                    {(item.suggested_import_quantity ?? 0) > 0 ? (
                      <span className="text-red-600">Nhập {item.suggested_import_quantity}</span>
                    ) : (item.overstock_quantity ?? 0) > 0 ? (
                      <span className="text-slate-500">Dư {item.overstock_quantity}</span>
                    ) : (
                      <span className="text-emerald-600">Vừa đủ</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getPriorityBadgeClass(item.priority)}`}>
                      {item.priority || 'LOW'}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {(!item.status || item.status === 'PENDING') && item.suggested_import_quantity > 0 && (
                        <button 
                          onClick={() => onApplySuggestion(item)}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center gap-1 shrink-0"
                        >
                          <span>Áp dụng</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                      {item.status === 'APPLIED' && (
                        <button 
                          onClick={() => navigate(`/inventory-ops?tab=import&planId=${item.application_id}`)}
                          className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors flex items-center gap-1 shrink-0"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Đã áp dụng</span>
                        </button>
                      )}
                      {item.status === 'COMPLETED' && (
                        <button 
                          onClick={() => navigate(`/inventory-ops?tab=import&planId=${item.application_id}`)}
                          className="px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors flex items-center gap-1 shrink-0"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Đã nhập kho</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
            </tbody>
        </table>
      </div>

      {/* Mobile view */}
      <div className="md:hidden flex flex-col divide-y divide-slate-100 bg-white">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Không tìm thấy sản phẩm phù hợp.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.product_id} className="p-4 flex flex-col gap-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 truncate">{item.product_name}</div>
                  <div className="text-xs text-slate-500 mt-1">{item.sku} • {item.category_name}</div>
                </div>
                <div className={`shrink-0 inline-flex items-center px-2 py-1 rounded text-[10px] font-medium border ${getPriorityBadgeClass(item.priority)}`}>
                  {item.priority || 'LOW'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm bg-slate-50 p-2 rounded-lg">
                <div>
                  <span className="text-xs text-slate-500 block">Tồn kho</span>
                  <span className={`font-semibold ${item.stock_quantity <= item.reorder_level ? 'text-red-600' : 'text-slate-700'}`}>
                    {item.stock_quantity ?? 0}
                  </span>
                  <span className="text-slate-400 text-xs ml-1">/ {item.reorder_level ?? 0}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Dự báo (14đ)</span>
                  <span className="font-semibold text-slate-700">{item.forecast_quantity ?? item.forecast_14d ?? 0}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Bán TB/ngày</span>
                  <span className="font-medium text-slate-700">{item.avg_daily_sales_90d ?? item.avg_daily_sales ?? 0}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Gợi ý</span>
                  <span className="font-bold">
                    {(item.suggested_import_quantity ?? 0) > 0 ? (
                      <span className="text-red-600">Nhập {item.suggested_import_quantity}</span>
                    ) : (item.overstock_quantity ?? 0) > 0 ? (
                      <span className="text-slate-500">Dư {item.overstock_quantity}</span>
                    ) : (
                      <span className="text-emerald-600">Vừa đủ</span>
                    )}
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 mt-1 border-t border-slate-50">
                <button 
                  className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100 flex items-center justify-center gap-1 text-sm font-medium w-full"
                  onClick={() => navigate(`/products?productId=${item.product_id}`)}
                >
                  <Eye className="w-4 h-4" /> Chi tiết
                </button>
                {(!item.status || item.status === 'PENDING') && (item.suggested_import_quantity ?? 0) > 0 && (
                  <button 
                    className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-1 text-sm font-medium w-full"
                    onClick={() => onApplySuggestion && onApplySuggestion(item)}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Áp dụng
                  </button>
                )}
                {item.status === 'APPLIED' && (
                  <button 
                    onClick={() => navigate(`/inventory-ops?tab=import&planId=${item.application_id}`)}
                    className="px-3 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1 text-sm font-medium w-full"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Đã áp dụng
                  </button>
                )}
                {item.status === 'COMPLETED' && (
                  <button 
                    onClick={() => navigate(`/inventory-ops?tab=import&planId=${item.application_id}`)}
                    className="px-3 py-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center justify-center gap-1 text-sm font-medium w-full"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Đã nhập kho
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-white">
          <span className="text-sm text-slate-600">
            Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} trên tổng số {totalItems} sản phẩm
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Trang trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-3 py-1 text-sm font-medium text-slate-700 flex items-center">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
