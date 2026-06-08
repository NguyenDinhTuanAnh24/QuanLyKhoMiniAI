import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Upload, Download, MoreHorizontal, LayoutGrid, List, Package, CheckCircle2, AlertTriangle, DollarSign, Eye, Pencil, Trash2 } from 'lucide-react';
import { getProducts } from '../services/productService';
import StatCard from './StatCard';

export default function ProductDashboard({ onNavigate }) {
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    page: 1,
    limit: 10
  });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const result = await getProducts(filters);
      setProducts(result.data);
      setMeta(result.meta);
    } catch (error) {
      console.error("Failed to load products", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleAddClick = () => {
    if (onNavigate) onNavigate('product-form', { product: null });
  };

  const handleEditClick = (product) => {
    if (onNavigate) onNavigate('product-form', { product });
  };

  // Tính toán thống kê
  const totalProducts = meta?.pagination?.total || 0;
  const activeProducts = products.filter(p => p.stock_quantity > p.reorder_level).length;
  const lowStockProducts = products.filter(p => p.stock_quantity <= p.reorder_level).length;
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.stock_quantity * (p.import_price || 0)), 0);

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  const formatCompactCurrency = (val) => {
    if (val >= 1e9) return `đ ${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `đ ${(val / 1e6).toFixed(1)}M`;
    return formatCurrency(val);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sản phẩm</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý toàn bộ sản phẩm trong hệ thống</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors shadow-sm">
            <Upload className="w-4 h-4" />
            Nhập Excel
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Xuất Excel
          </button>
          <button onClick={handleAddClick} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} iconColorClass="bg-blue-50 text-blue-600" label="Tổng sản phẩm" value={totalProducts} trend="up" trendLabel="+4 mới" />
        <StatCard icon={CheckCircle2} iconColorClass="bg-green-50 text-green-600" label="Đang bán" value={activeProducts} trend="up" trendLabel="91%" />
        <StatCard icon={AlertTriangle} iconColorClass="bg-amber-50 text-amber-600" label="Cần nhập" value={lowStockProducts} trend="down" trendLabel="9%" />
        <StatCard icon={DollarSign} iconColorClass="bg-purple-50 text-purple-600" label="Tổng giá trị" value={formatCompactCurrency(totalInventoryValue)} trend="up" trendLabel="+5.2%" />
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-2">
        <div className="relative flex-1 md:max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm theo tên, SKU..."
            className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={filters.search}
            onChange={handleSearchChange}
          />
        </div>
        
        <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Danh mục</option>
        </select>
        
        <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Trạng thái</option>
        </select>

        <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tình trạng kho</option>
        </select>

        <div className="flex-1"></div>

        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button className="p-1.5 bg-white text-blue-600 shadow-sm rounded-md"><List className="w-4 h-4" /></button>
          <button className="p-1.5 text-slate-400 hover:text-slate-600"><LayoutGrid className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="p-4 w-12 text-center">
                  <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                </th>
                <th className="p-4">Sản phẩm</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Danh mục</th>
                <th className="p-4 text-right">Giá nhập</th>
                <th className="p-4 text-right">Giá bán</th>
                <th className="p-4 text-center">Tồn kho</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="9" className="text-center p-8 text-slate-500">Đang tải dữ liệu...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan="9" className="text-center p-8 text-slate-500">Không tìm thấy sản phẩm nào</td></tr>
              ) : (
                products.map(product => {
                  const isLowStock = product.stock_quantity <= product.reorder_level;
                  const isOutOfStock = product.stock_quantity === 0;
                  
                  let badge = { text: 'Đang bán', class: 'bg-green-50 text-green-700 border-green-200' };
                  if (isOutOfStock) {
                    badge = { text: 'Hết hàng', class: 'bg-red-50 text-red-700 border-red-200' };
                  } else if (isLowStock) {
                    badge = { text: 'Cần nhập', class: 'bg-amber-50 text-amber-700 border-amber-200' };
                  } else if (product.status === 'Tạm ngừng') {
                    badge = { text: 'Tạm ngừng', class: 'bg-slate-100 text-slate-600 border-slate-200' };
                  }

                  return (
                    <tr key={product.product_id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4 text-center">
                        <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <List className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                              {product.product_name}
                            </div>
                            <div className="text-xs text-slate-500">{product.category_name || product.category?.category_name || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600">{product.sku}</td>
                      <td className="p-4 text-slate-600">{product.category_name || product.category?.category_name || 'N/A'}</td>
                      <td className="p-4 text-right text-slate-600 font-medium">{formatCurrency(product.import_price)}</td>
                      <td className="p-4 text-right text-slate-900 font-medium">{formatCurrency(product.selling_price)}</td>
                      <td className="p-4 text-center">
                        <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-slate-700'}`}>
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${badge.class}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-3 text-sm">
                          <button className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors font-medium">
                            <Eye className="w-4 h-4" /> Xem
                          </button>
                          <button onClick={() => handleEditClick(product)} className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors font-medium">
                            <Pencil className="w-4 h-4" /> Sửa
                          </button>
                          <button className="flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors font-medium">
                            <Trash2 className="w-4 h-4" /> Xoá
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {meta?.pagination && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="text-sm text-slate-500">
              Hiển thị <span className="font-medium text-slate-900">{(filters.page - 1) * filters.limit + 1}</span> đến <span className="font-medium text-slate-900">{Math.min(filters.page * filters.limit, meta.pagination.total)}</span> trong tổng số <span className="font-medium text-slate-900">{meta.pagination.total}</span> sản phẩm
            </div>
            <div className="flex gap-1">
              <button 
                className="px-3 py-1 border border-slate-200 bg-white text-slate-600 rounded hover:bg-slate-50 disabled:opacity-50 text-sm font-medium"
                disabled={filters.page === 1}
                onClick={() => setFilters(prev => ({...prev, page: prev.page - 1}))}
              >
                Trước
              </button>
              <button 
                className="px-3 py-1 border border-slate-200 bg-white text-slate-600 rounded hover:bg-slate-50 disabled:opacity-50 text-sm font-medium"
                disabled={filters.page === meta.pagination.totalPages}
                onClick={() => setFilters(prev => ({...prev, page: prev.page + 1}))}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
