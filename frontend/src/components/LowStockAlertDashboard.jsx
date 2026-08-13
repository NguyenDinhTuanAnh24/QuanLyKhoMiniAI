import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, AlertTriangle, Layers, ArrowRight, Search, RefreshCw } from 'lucide-react';
import StatCard from './StatCard';
import { useToast } from '../contexts/ToastContext';
import { getCategories } from '../services/categoryService';
import api from '../services/api';


export default function LowStockAlertDashboard({ onNavigate }) {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // States for filtering and pagination
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [categories, setCategories] = useState([]);

  const [data, setData] = useState({
    summary: {
      total_products: 0,
      low_stock_count: 0,
      out_of_stock_count: 0,
      category_need_attention: 0
    },
    alerts: [],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0
    }
  });

  // Load categories for dropdown
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await getCategories();
        if (res && res.data) {
          setCategories(res.data.map(c => c.category_name).filter(Boolean));
        }
      } catch (error) {
        console.error("Failed to load categories", error);
      }
    };
    loadCategories();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategory, selectedStatus]);

  // Fetch data
  useEffect(() => {
    fetchAlerts();
  }, [page, debouncedSearch, selectedCategory, selectedStatus]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '5',
        search: debouncedSearch,
        category: selectedCategory,
        status: selectedStatus
      });

      const response = await api.get(`/inventory/low-stock-alerts?${queryParams.toString()}`);
      if (response.data.success) {
        setData(response.data.data);
      } else {
        showToast('Không thể tải dữ liệu cảnh báo', 'error');
      }
    } catch (error) {
      console.error('Failed to fetch low stock alerts', error);
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        showToast('Lỗi kết nối máy chủ', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedCategory('');
    setSelectedStatus('');
    setPage(1);
  };

  const handleCreateImportOrder = (item) => {
    const suggestedQty = item.suggested_import_quantity || item.reorder_quantity || Math.max(10, (item.reorder_level || 10) * 2 - (item.stock_quantity || 0));
    navigate(`/inventory-ops?productId=${item.product_id}&product_id=${item.product_id}&action=import&quantity=${suggestedQty}`, {
      state: {
        autoSelectProductId: item.product_id,
        product_id: item.product_id,
        quantity: suggestedQty,
        item: item
      }
    });
  };

  const getBadgeClass = (status) => {
    if (status === 'Hết hàng') {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    if (status === 'Rất nguy cấp') {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    }
    return 'bg-amber-100 text-amber-800 border-amber-200'; // Sắp hết hàng
  };

  const handleExportExcel = async () => {
    try {
      const excelModule = await import('exceljs');
      const ExcelJS = excelModule.default || excelModule;
      const fileSaverModule = await import('file-saver');
      const saveAs = fileSaverModule.saveAs || fileSaverModule.default?.saveAs || fileSaverModule.default;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Canh Bao Ton Kho');

      worksheet.columns = [
        { header: 'Mã SP', key: 'sku', width: 15 },
        { header: 'Tên Sản Phẩm', key: 'product_name', width: 40 },
        { header: 'Danh Mục', key: 'category_name', width: 25 },
        { header: 'Tồn Kho', key: 'stock_quantity', width: 15 },
        { header: 'Mức An Toàn', key: 'reorder_level', width: 15 },
        { header: 'Trạng Thái', key: 'alert_status', width: 20 },
      ];

      // Fetch all filtered items by using a large limit
      const queryParams = new URLSearchParams({
        page: '1',
        limit: '9999',
        search: debouncedSearch,
        category: selectedCategory,
        status: selectedStatus
      });
      
      const response = await api.get(`/inventory/low-stock-alerts?${queryParams.toString()}`);
      
      let exportData = [];
      if (response.data.success && response.data.data && response.data.data.alerts) {
        exportData = response.data.data.alerts;
      } else {
        exportData = data.alerts;
      }

      if (exportData.length === 0) {
        showToast({ type: 'error', title: 'Lỗi', message: 'Không có dữ liệu để xuất' });
        return;
      }

      exportData.forEach(item => {
        worksheet.addRow({
          sku: item.sku,
          product_name: item.product_name,
          category_name: item.category_name || 'N/A',
          stock_quantity: item.stock_quantity,
          reorder_level: item.reorder_level,
          alert_status: item.status
        });
      });

      worksheet.getRow(1).font = { bold: true };
      
      ['A', 'D', 'E', 'F'].forEach(col => {
        worksheet.getColumn(col).alignment = { vertical: 'middle', horizontal: 'center' };
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
      saveAs(new Blob([buffer]), `Bao_cao_ton_kho_thap_${dateStr}.xlsx`);
      
      showToast({ type: 'success', title: 'Thành công', message: 'Xuất file Excel thành công' });
    } catch (error) {
      console.error('Lỗi khi xuất Excel:', error);
      showToast({ type: 'error', title: 'Lỗi', message: 'Không thể xuất báo cáo' });
    }
  };

  const { currentPage, totalPages, totalItems } = data.pagination;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cảnh báo tồn kho</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý các mặt hàng sắp hết hoặc cần nhập gấp</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Package}
          iconColorClass="bg-blue-50 text-blue-600"
          label="Tổng sản phẩm trong hệ thống"
          value={data.summary.total_products.toLocaleString('vi-VN')}
          trend=""
          trendLabel="Tháng này"
        />
        <StatCard
          icon={AlertTriangle}
          iconColorClass="bg-red-50 text-red-600"
          label="Sản phẩm sắp/hết hàng"
          value={data.summary.low_stock_count}
          trend="down"
          trendLabel="-2%"
        />
        <StatCard
          icon={Layers}
          iconColorClass="bg-cyan-50 text-cyan-600"
          label="Danh mục cần lưu ý"
          value={data.summary.category_need_attention}
          trend=""
          trendLabel="Cấp bách"
        />
      </div>

      {/* AI Insight banner */}
      <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between border border-blue-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
            <span className="font-bold text-lg">AI</span>
          </div>
          <p className="text-blue-800 text-sm font-medium">
            AI Insight: Có {data.summary.low_stock_count} sản phẩm cần bổ sung để đảm bảo hoạt động kinh doanh.
          </p>
        </div>
        <button
          onClick={() => onNavigate('ai-insights')}
          className="text-blue-600 text-sm font-semibold hover:text-blue-800 flex items-center gap-1 transition-colors whitespace-nowrap"
        >
          Xem phân tích chi tiết <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-semibold text-slate-800">Chi tiết hàng tồn thấp</h2>
          <button 
            onClick={handleExportExcel}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            Xuất báo cáo
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full md:w-auto md:max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm theo tên, SKU..."
              className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Tất cả danh mục</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái cảnh báo</option>
            <option value="Hết hàng">Hết hàng</option>
            <option value="Rất nguy cấp">Rất nguy cấp</option>
            <option value="Sắp hết hàng">Sắp hết hàng</option>
          </select>

          {(searchTerm || selectedCategory || selectedStatus) && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap"
              title="Đặt lại bộ lọc"
            >
              <RefreshCw className="w-4 h-4" /> Đặt lại
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Đang tải dữ liệu...</div>
        ) : data.alerts.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">Kho hàng đang ổn định</h3>
            <p className="text-slate-500 text-sm">Không có sản phẩm nào phù hợp với điều kiện tìm kiếm.</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="p-4 pl-6">Mã SP</th>
                  <th className="p-4">Tên Sản Phẩm</th>
                  <th className="p-4">Danh Mục</th>
                  <th className="p-4 text-center">Tồn Kho</th>
                  <th className="p-4 text-center">Mức An Toàn</th>
                  <th className="p-4 text-center">Trạng Thái</th>
                  <th className="p-4 text-center pr-6">Hành Động</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {data.alerts.map(item => (
                  <tr key={item.product_id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 pl-6">
                      <span className="text-blue-600 font-medium cursor-pointer hover:underline">
                        {item.sku}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          <Package className="w-5 h-5" />
                        </div>
                        <div className="font-medium text-slate-900">
                          {item.product_name}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">{item.category_name || 'N/A'}</td>
                    <td className="p-4 text-center">
                      <span className={`font-bold ${item.alert_level === 'high' || item.alert_level === 'critical' ? 'text-red-600' : 'text-slate-900'}`}>
                        {item.stock_quantity}
                      </span>
                    </td>
                    <td className="p-4 text-center text-slate-600">
                      {item.reorder_level}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getBadgeClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-center pr-6">
                      <button
                        onClick={() => handleCreateImportOrder(item)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 rounded font-semibold transition-colors text-xs"
                      >
                        Tạo đơn nhập kho
                      </button>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden flex flex-col divide-y divide-slate-100 flex-1">
              {data.alerts.map(item => (
                <div key={item.product_id} className="p-4 flex flex-col gap-3 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 truncate">{item.product_name}</div>
                      <div className="text-xs text-blue-600 mt-1 cursor-pointer hover:underline">{item.sku}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.category_name || 'N/A'}</div>
                    </div>
                    <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getBadgeClass(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm bg-slate-50 p-2 rounded-lg">
                    <div>
                      <span className="text-xs text-slate-500 block">Tồn kho</span>
                      <span className={`font-bold ${item.alert_level === 'high' || item.alert_level === 'critical' ? 'text-red-600' : 'text-slate-900'}`}>
                        {item.stock_quantity}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">Mức an toàn</span>
                      <span className="text-slate-600">{item.reorder_level}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-50 flex justify-end">
                    <button
                      onClick={() => handleCreateImportOrder(item)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 rounded font-semibold transition-colors text-xs"
                    >
                      Tạo đơn nhập kho
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination Footer */}
        {data.alerts.length > 0 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
            <div className="text-sm text-slate-500">
              Hiển thị <span className="font-medium text-slate-900">{(currentPage - 1) * 5 + 1}</span> - <span className="font-medium text-slate-900">{Math.min(currentPage * 5, totalItems)}</span> trong tổng số <span className="font-medium text-slate-900">{totalItems}</span> sản phẩm
            </div>
            {totalPages > 1 && (
              <div className="flex gap-1">
                <button
                  className="px-3 py-1 border border-slate-200 bg-white text-slate-600 rounded hover:bg-slate-50 disabled:opacity-50 text-sm font-medium transition-colors"
                  disabled={currentPage === 1}
                  onClick={() => setPage(prev => prev - 1)}
                >
                  Trước
                </button>
                <div className="px-3 py-1 text-sm font-medium text-slate-600">
                  {currentPage} / {totalPages}
                </div>
                <button
                  className="px-3 py-1 border border-slate-200 bg-white text-slate-600 rounded hover:bg-slate-50 disabled:opacity-50 text-sm font-medium transition-colors"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(prev => prev + 1)}
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
