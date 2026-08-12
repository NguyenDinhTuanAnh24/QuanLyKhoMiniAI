import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { activityLogService } from '../services/activityLogService';
import { History, Search, Filter, Loader2 } from 'lucide-react';
import MainLayout from '../components/MainLayout';
import PageHeader from '../components/PageHeader';

const ACTION_LABELS = {
  'LOGIN': 'Đăng nhập',
  'LOGOUT': 'Đăng xuất',
  'CHANGE_PASSWORD': 'Đổi mật khẩu',
  'CREATE_PRODUCT': 'Thêm sản phẩm',
  'UPDATE_PRODUCT': 'Cập nhật sản phẩm',
  'DELETE_PRODUCT': 'Xóa sản phẩm',
  'IMPORT_STOCK': 'Nhập kho',
  'EXPORT_STOCK': 'Xuất kho',
  'CREATE_ORDER': 'Tạo đơn hàng',
  'UPDATE_SETTING': 'Cập nhật cài đặt'
};

const ENTITY_LABELS = {
  'USER': 'Người dùng',
  'PRODUCT': 'Sản phẩm',
  'ORDER': 'Đơn hàng',
  'SETTING': 'Cài đặt'
};

const ActivityLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({ action: '', entity_type: '' });
  const { addToast } = useToast();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await activityLogService.getLogs({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });
      if (res.success) {
        setLogs(res.data || []);
        setPagination(res.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Lỗi',
        message: error.message || 'Không thể tải nhật ký hoạt động'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const renderActionBadge = (action) => {
    let color = 'bg-gray-100 text-gray-800 border-gray-200';
    if (action.includes('CREATE') || action.includes('IMPORT')) color = 'bg-green-50 text-green-700 border-green-200';
    if (action.includes('UPDATE')) color = 'bg-blue-50 text-blue-700 border-blue-200';
    if (action.includes('DELETE') || action.includes('EXPORT')) color = 'bg-red-50 text-red-700 border-red-200';
    if (action.includes('LOGIN')) color = 'bg-blue-50 text-blue-700 border-blue-200';

    return (
      <span className={`px-2.5 py-1 text-xs font-medium border rounded-full ${color}`}>
        {ACTION_LABELS[action] || action}
      </span>
    );
  };

  const formatDetailKey = (key) => {
    const keyMap = {
      // Product
      product_name: 'Tên SP',
      product_name_en: 'Tên SP (TA)',
      sku: 'SKU',
      price: 'Giá bán',
      import_price: 'Giá nhập',
      selling_price: 'Giá bán',
      quantity: 'Số lượng',
      stock_quantity: 'Tồn kho',
      reorder_level: 'Mức tồn tối thiểu',
      reorder_quantity: 'SL đặt lại',
      date_received: 'Ngày nhập',
      expiration_date: 'Ngày hết hạn',
      warehouse_location: 'Vị trí kho',
      sales_90d: 'Đã bán 90N',
      avg_daily_sales_90d: 'Bán TB ngày',
      forecast_14d: 'Dự báo 14N',
      suggested_import_quantity: 'SL nhập đề xuất',
      source_row_count: 'Số dòng nguồn',
      
      // Order
      total: 'Tổng tiền',
      total_amount: 'Tổng tiền',
      customer_name: 'Khách hàng',
      payment_method: 'PT thanh toán',
      order_id: 'Mã đơn hàng',
      order_code: 'Mã đơn hàng',
      created_by: 'Người tạo',
      items: 'Sản phẩm',
      
      // Stock Movement
      type: 'Loại thao tác',
      old_quantity: 'SL cũ',
      new_quantity: 'SL mới',
      unit_price: 'Đơn giá',
      
      // User
      role: 'Vai trò',
      status: 'Trạng thái',
      email: 'Email',
      full_name: 'Họ tên',
      phone: 'Số điện thoại',
      user_id: 'Mã người dùng',
      ip: 'Địa chỉ IP',
      message: 'Hệ thống',
      
      // Common & Master Data
      old_value: 'Giá trị cũ',
      new_value: 'Giá trị mới',
      note: 'Ghi chú',
      description: 'Mô tả',
      category_id: 'Danh mục',
      category_name: 'Tên danh mục',
      supplier_id: 'Nhà cung cấp',
      supplier_name: 'Tên NCC',
      unit_id: 'Đơn vị tính',
      unit_name: 'Tên ĐVT',
      address: 'Địa chỉ',
      
      // Settings
      store_name: 'Tên cửa hàng',
      store_phone: 'SĐT cửa hàng',
      store_email: 'Email cửa hàng',
      store_address: 'Địa chỉ cửa hàng',
      low_stock_warning_days: 'Ngày cảnh báo tồn',
      default_reorder_level: 'Tồn tối thiểu mặc định',
      auto_stock_alert_enabled: 'Cảnh báo tự động',
      allow_negative_stock: 'Cho phép tồn âm',
      ai_enabled: 'Bật AI',
      ai_provider: 'Nhà cung cấp AI',
      ai_model: 'Mô hình AI',
      forecast_days: 'Số ngày dự báo',
      payos_enabled: 'Bật PayOS',
      bank_name: 'Tên ngân hàng',
      bank_account_no: 'Số TK ngân hàng',
      bank_account_name: 'Chủ TK ngân hàng',
      currency: 'Tiền tệ',
      date_format: 'Định dạng ngày',
      maintenance_mode: 'Bảo trì',
      store_logo_url: 'Logo cửa hàng'
    };
    return keyMap[key] || key;
  };

  const formatDetailValue = (key, value) => {
    if (value === true || value === 'true') return 'Có';
    if (value === false || value === 'false') return 'Không';
    
    // Các giá trị Role
    if (value === 'OWNER') return 'Chủ cửa hàng';
    if (value === 'ADMIN') return 'Quản trị viên';
    if (value === 'WAREHOUSE_STAFF') return 'Nhân viên kho';
    if (value === 'SALES_STAFF') return 'Nhân viên bán hàng';
    
    // Các giá trị Status
    if (value === 'Active' || value === 'ACTIVE') return 'Hoạt động';
    if (value === 'Inactive' || value === 'INACTIVE') return 'Khóa';
    
    return String(value);
  };

  const renderDetails = (details) => {
    if (!details || Object.keys(details).length === 0) return <span className="text-gray-400 italic text-xs">Không có chi tiết</span>;
    
    try {
      let data = details;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) {}
      }

      if (typeof data !== 'object' || data === null) {
        return <span className="text-gray-500 text-xs">{String(data)}</span>;
      }

      const entries = Object.entries(data).filter(([key, value]) => {
        return !['id', 'created_at', 'updated_at', 'deleted_at', 'password', 'product_id', 'user_id', 'category_name', 'unit_name', 'role', 'status'].includes(key) && 
               value !== null && 
               value !== undefined && 
               typeof value !== 'object';
      });

      if (entries.length === 0) return <span className="text-gray-400 italic text-xs">Không có chi tiết bổ sung</span>;

      return (
        <div className="space-y-1">
          {entries.map(([key, value], idx) => (
            <div key={idx} className="flex gap-2 text-xs">
              <span className="font-semibold text-gray-700 whitespace-nowrap min-w-[80px]">{formatDetailKey(key)}:</span>
              <span className="text-blue-600 truncate flex-1 font-medium" title={String(value)}>{formatDetailValue(key, value)}</span>
            </div>
          ))}
        </div>
      );
    } catch (e) {
      return <span className="text-gray-500 text-xs">{String(details)}</span>;
    }
  };

  return (
    <>
      <div className="max-w-[1600px] mx-auto space-y-6">
        <PageHeader 
          title="Nhật ký hoạt động" 
          subtitle="Theo dõi các thay đổi và thao tác trong hệ thống"
          icon={History}
        />

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4 items-center flex-1">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors h-10"
                />
              </div>
              <select
                name="action"
                value={filters.action}
                onChange={handleFilterChange}
                className="pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors h-10 bg-white"
              >
                <option value="">Tất cả thao tác</option>
                {Object.entries(ACTION_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <select
                name="entity_type"
                value={filters.entity_type}
                onChange={handleFilterChange}
                className="pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors h-10 bg-white"
              >
                <option value="">Tất cả đối tượng</option>
                {Object.entries(ENTITY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={fetchLogs}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors h-10 w-10 flex items-center justify-center"
              title="Làm mới"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-500">Đang tải dữ liệu...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                Không tìm thấy nhật ký hoạt động nào
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <th className="px-6 py-4 font-medium whitespace-nowrap">Thời gian</th>
                    <th className="px-6 py-4 font-medium">Người dùng / Vai trò</th>
                    <th className="px-6 py-4 font-medium">Thao tác / Kết quả</th>
                    <th className="px-6 py-4 font-medium">Đối tượng</th>
                    <th className="px-6 py-4 font-medium">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => {
                    let detailsObj = {};
                    try {
                      if (typeof log.details === 'string') {
                        detailsObj = JSON.parse(log.details);
                      } else {
                        detailsObj = log.details || {};
                      }
                    } catch (e) {}

                    const roleLabel = detailsObj.role ? formatDetailValue('role', detailsObj.role) : '';
                    const statusLabel = detailsObj.status ? formatDetailValue('status', detailsObj.status) : '';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-start gap-1.5">
                            <div>
                              <div className="font-medium text-slate-900">{log.user_name || 'Hệ thống'}</div>
                              <div className="text-xs text-slate-500">{log.user_id || 'N/A'}</div>
                            </div>
                            {roleLabel && (
                              <div className="text-[10px] font-semibold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                {roleLabel}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col items-start gap-2">
                            {renderActionBadge(log.action)}
                            {statusLabel && (
                              <div className="text-[10px] font-semibold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                {statusLabel}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                            {ENTITY_LABELS[log.entity_type] || log.entity_type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-h-32 overflow-y-auto w-full min-w-[280px] p-2.5 bg-blue-50/30 rounded-lg border border-blue-100/50 shadow-sm">
                            {renderDetails(log.details)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {!loading && logs.length > 0 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
              <div>
                Hiển thị {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} trong số {pagination.total} nhật ký
              </div>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Trang trước
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Trang sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ActivityLogsPage;
