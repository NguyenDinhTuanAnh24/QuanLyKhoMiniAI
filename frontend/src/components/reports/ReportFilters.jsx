import React from 'react';
import { Filter, RefreshCcw, Download } from 'lucide-react';

export default function ReportFilters({ 
  filters, 
  setFilters, 
  categories, 
  suppliers, 
  onFilter, 
  onRefresh, 
  onExport,
  loading 
}) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-wrap gap-4 items-end">
      <div className="flex-1 min-w-[200px]">
        <label className="block text-sm font-medium text-slate-700 mb-1">Khoảng thời gian</label>
        <select 
          name="dateRange" 
          value={filters.dateRange} 
          onChange={handleChange}
          className="w-full h-10 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
        >
          <option value="today">Hôm nay</option>
          <option value="yesterday">Hôm qua</option>
          <option value="this_week">Tuần này</option>
          <option value="this_month">Tháng này</option>
          <option value="last_month">Tháng trước</option>
          <option value="this_year">Năm nay</option>
          <option value="all_time">Tất cả</option>
        </select>
      </div>

      <div className="flex-1 min-w-[200px]">
        <label className="block text-sm font-medium text-slate-700 mb-1">Danh mục</label>
        <select 
          name="categoryId" 
          value={filters.categoryId} 
          onChange={handleChange}
          className="w-full h-10 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map(cat => (
            <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-w-[200px]">
        <label className="block text-sm font-medium text-slate-700 mb-1">Nhà cung cấp</label>
        <select 
          name="supplierId" 
          value={filters.supplierId} 
          onChange={handleChange}
          className="w-full h-10 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
        >
          <option value="">Tất cả nhà cung cấp</option>
          {suppliers.map(sup => (
            <option key={sup.supplier_id} value={sup.supplier_id}>{sup.supplier_name}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 mt-4 lg:mt-0">
        <button
          onClick={onFilter}
          disabled={loading}
          className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70"
        >
          <Filter className="w-4 h-4" />
          <span>Lọc dữ liệu</span>
        </button>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="h-10 px-4 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
        <button
          onClick={onExport}
          disabled={loading}
          className="h-10 px-4 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70"
        >
          <Download className="w-4 h-4" />
          <span>Xuất Excel</span>
        </button>
      </div>
    </div>
  );
}
