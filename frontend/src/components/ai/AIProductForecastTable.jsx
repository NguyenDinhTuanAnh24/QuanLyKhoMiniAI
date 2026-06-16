import React, { useState } from 'react';
import { Search, Filter, RefreshCcw, ArrowRight, Eye, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function AIProductForecastTable({ data, categories, loading, onApplySuggestion }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('');

  const getRiskBadgeClass = (risk) => {
    switch(risk) {
      case 'Hết hàng': return 'bg-red-100 text-red-700 border-red-200';
      case 'Rủi ro cao': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Cần nhập': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Ổn định': return 'bg-green-100 text-green-700 border-green-200';
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
  };

  const filteredData = data.filter(item => {
    const matchSearch = item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory ? item.category_name === selectedCategory : true;
    const matchRisk = selectedRisk ? item.risk_level === selectedRisk : true;
    return matchSearch && matchCategory && matchRisk;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <h3 className="text-lg font-bold text-slate-900">Dự báo nhu cầu từng sản phẩm (tuần tới)</h3>
      </div>
      
      {/* Filters */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 bg-white">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tên sản phẩm hoặc SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div className="flex gap-3">
          <div className="relative w-40">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none truncate"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c, i) => (
                <option key={i} value={c.category_name}>{c.category_name}</option>
              ))}
            </select>
          </div>
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="w-36 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Trạng thái</option>
            <option value="Hết hàng">Hết hàng</option>
            <option value="Rủi ro cao">Rủi ro cao</option>
            <option value="Cần nhập">Cần nhập</option>
            <option value="Ổn định">Ổn định</option>
          </select>
          <button 
            onClick={resetFilters}
            className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            title="Đặt lại bộ lọc"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
              <th className="p-4 font-semibold">Sản phẩm</th>
              <th className="p-4 font-semibold text-center">Tồn</th>
              <th className="p-4 font-semibold text-center">Dự báo</th>
              <th className="p-4 font-semibold text-center">Nên nhập</th>
              <th className="p-4 font-semibold text-center">Xu hướng</th>
              <th className="p-4 font-semibold text-center">Độ tin cậy</th>
              <th className="p-4 font-semibold text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-500">Đang tải dữ liệu...</td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-500">
                  Không tìm thấy sản phẩm phù hợp.
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.product_id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-slate-900">{item.product_name}</div>
                    <div className="text-xs text-slate-500">{item.sku} • {item.category_name}</div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`font-semibold ${item.stock_quantity <= 0 ? 'text-red-600' : 'text-slate-700'}`}>
                      {item.stock_quantity}
                    </span>
                  </td>
                  <td className="p-4 text-center font-medium text-slate-700">{item.forecast_14d}</td>
                  <td className="p-4 text-center font-bold text-blue-600">
                    {item.suggested_import_quantity > 0 ? `+${item.suggested_import_quantity}` : '-'}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center">
                      {getTrendIcon(item.avg_daily_sales_90d > 0 ? 1 : 0)}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-xs font-medium text-slate-700">
                      {item.confidence_score}%
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
                      {item.suggested_import_quantity > 0 && (
                        <button 
                          onClick={() => onApplySuggestion(item)}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center gap-1"
                        >
                          <span>Áp dụng</span>
                          <ArrowRight className="w-3 h-3" />
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
    </div>
  );
}
