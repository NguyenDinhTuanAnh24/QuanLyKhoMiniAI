import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { activityLogService } from '../services/activityLogService';
import { History, Search, Filter, Loader2 } from 'lucide-react';
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

  const formatDateShort = (dateString) => {
    const d = new Date(dateString);
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${time} · ${date}`;
  };

  const renderActionBadge = (action, isMobile = false) => {
    let color = 'bg-gray-100 text-gray-800 border-gray-200';
    if (action.includes('CREATE') || action.includes('IMPORT')) color = 'bg-green-50 text-green-700 border-green-200';
    if (action.includes('UPDATE')) color = 'bg-blue-50 text-blue-700 border-blue-200';
    if (action.includes('DELETE') || action.includes('EXPORT')) color = 'bg-red-50 text-red-700 border-red-200';
    if (action.includes('LOGIN')) color = 'bg-blue-50 text-blue-700 border-blue-200';

    return (
      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium border rounded-full max-w-full break-words whitespace-normal ${color}`}>
        {ACTION_LABELS[action] || action}
      </span>
    );
  };

  const formatDetailKey = (key) => {
    const keyMap = {
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
      total: 'Tổng tiền',
      total_amount: 'Tổng tiền',
      customer_name: 'Khách hàng',
      payment_method: 'PT thanh toán',
      order_id: 'Mã đơn hàng',
      order_code: 'Mã đơn hàng',
      created_by: 'Người tạo',
      items: 'Sản phẩm',
      type: 'Loại thao tác',
      old_quantity: 'SL cũ',
      new_quantity: 'SL mới',
      unit_price: 'Đơn giá',
      role: 'Vai trò',
      status: 'Trạng thái',
      email: 'Email',
      full_name: 'Họ tên',
      phone: 'Số điện thoại',
      user_id: 'Mã người dùng',
      ip: 'Địa chỉ IP',
      message: 'Hệ thống',
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
    if (value === 'OWNER') return 'Chủ cửa hàng';
    if (value === 'ADMIN') return 'Quản trị viên';
    if (value === 'WAREHOUSE_STAFF') return 'Nhân viên kho';
    if (value === 'SALES_STAFF') return 'Nhân viên bán hàng';
    if (value === 'Active' || value === 'ACTIVE') return 'Hoạt động';
    if (value === 'Inactive' || value === 'INACTIVE') return 'Khóa';
    return String(value);
  };

  const renderDetails = (details, isMobile = false) => {
    if (!details || Object.keys(details).length === 0) return <span className="text-gray-400 italic text-xs">Không có chi tiết</span>;
    
    try {
      let data = details;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) {}
      }

      if (typeof data !== 'object' || data === null) {
        return <span className="text-gray-500 text-xs break-all">{String(data)}</span>;
      }

      const entries = Object.entries(data).filter(([key, value]) => {
        return !['id', 'created_at', 'updated_at', 'deleted_at', 'password', 'product_id', 'user_id', 'category_name', 'unit_name', 'role', 'status'].includes(key) && 
               value !== null && 
               value !== undefined && 
               typeof value !== 'object';
      });

      if (entries.length === 0) return <span className="text-gray-400 italic text-xs">Không có chi tiết bổ sung</span>;

      return (
        <div className="space-y-1 w-full min-w-0">
          {entries.map(([key, value], idx) => (
            <div key={idx} className={`flex gap-2 text-xs ${isMobile ? 'flex-col sm:flex-row items-start' : ''}`}>
              <span className="font-semibold text-gray-700 whitespace-nowrap min-w-[80px]">{formatDetailKey(key)}:</span>
              <span className="text-blue-600 break-words whitespace-normal font-medium flex-1">{formatDetailValue(key, value)}</span>
            </div>
          ))}
        </div>
      );
    } catch (e) {
      return <span className="text-gray-500 text-xs break-all">{String(details)}</span>;
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-4 md:space-y-6 w-full min-w-0 px-4 sm:px-6 lg:px-8 py-4 md:py-6">
      <PageHeader 
        title="Nhật ký hoạt động" 
        subtitle="Theo dõi các thay đổi và thao tác trong hệ thống"
        icon={History}
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 w-full min-w-0 flex flex-col">
        {/* Filters */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-3 md:gap-4 items-start md:items-center justify-between">
          <div className="grid grid-cols-2 md:flex gap-3 md:gap-4 items-center flex-1 w-full min-w-0">
            <div className="relative col-span-2 md:w-64">
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
              className="col-span-1 w-full md:w-auto pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors h-10 bg-white truncate"
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
              className="col-span-1 w-full md:w-auto pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors h-10 bg-white truncate"
            >
              <option value="">Tất cả đối tượng</option>
              {Object.entries(ENTITY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={fetchLogs}
            className="w-full md:w-10 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors h-10 flex items-center justify-center shrink-0"
            title="Làm mới"
          >
            <Filter className="w-4 h-4 mr-2 md:mr-0 md:hidden block" />
            <span className="md:hidden">Bộ lọc</span>
            <Filter className="w-4 h-4 hidden md:block" />
          </button>
        </div>

        <div className="w-full min-w-0 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-500">Đang tải dữ liệu...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-slate-500 flex flex-col items-center gap-2">
              <History className="w-8 h-8 text-slate-300" />
              <p>Chưa có nhật ký hoạt động nào</p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden md:block overflow-x-auto w-full">
                <table className="w-full text-left text-sm table-fixed min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                      <th className="px-6 py-4 font-medium whitespace-nowrap w-44">Thời gian</th>
                      <th className="px-6 py-4 font-medium w-48">Người dùng / Vai trò</th>
                      <th className="px-6 py-4 font-medium w-48">Thao tác / Kết quả</th>
                      <th className="px-6 py-4 font-medium w-36">Đối tượng</th>
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
                          <td className="px-6 py-4 text-slate-600 align-top">
                            {formatDate(log.created_at)}
                          </td>
                          <td className="px-6 py-4 align-top">
                            <div className="flex flex-col items-start gap-1.5">
                              <div className="min-w-0 w-full">
                                <div className="font-medium text-slate-900 truncate" title={log.user_name || 'Hệ thống'}>{log.user_name || 'Hệ thống'}</div>
                                <div className="text-xs text-slate-500 truncate" title={log.user_id || 'N/A'}>{log.user_id || 'N/A'}</div>
                              </div>
                              {roleLabel && (
                                <div className="text-[10px] font-semibold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded border border-blue-100 max-w-full break-words whitespace-normal">
                                  {roleLabel}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 align-top">
                            <div className="flex flex-col items-start gap-2">
                              {renderActionBadge(log.action)}
                              {statusLabel && (
                                <div className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border max-w-full break-words whitespace-normal ${statusLabel === 'Thành công' || statusLabel === 'Hoạt động' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-red-600 bg-red-50 border-red-100'}`}>
                                  {statusLabel}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 align-top">
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 max-w-full break-words whitespace-normal">
                              {ENTITY_LABELS[log.entity_type] || log.entity_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 align-top">
                            <div className="max-h-32 overflow-y-auto w-full min-w-[200px] p-2.5 bg-blue-50/30 rounded-lg border border-blue-100/50 shadow-sm">
                              {renderDetails(log.details)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="md:hidden flex flex-col gap-3 p-4 bg-slate-50/50">
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
                    <div key={log.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col gap-3 w-full min-w-0">
                      <div className="flex justify-between items-start gap-3 w-full min-w-0">
                        <div className="flex-1 flex flex-wrap gap-2 min-w-0">
                          {renderActionBadge(log.action, true)}
                          {statusLabel && (
                            <span className={`inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase rounded border max-w-full break-words whitespace-normal ${statusLabel === 'Thành công' || statusLabel === 'Hoạt động' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-700 bg-red-50 border-red-200'}`}>
                              {statusLabel}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap shrink-0 pt-0.5">
                          {formatDateShort(log.created_at)}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 w-full min-w-0">
                        <div className="font-medium text-sm text-slate-900 truncate" title={log.user_name || 'Hệ thống'}>{log.user_name || 'Hệ thống'}</div>
                        <div className="text-xs text-slate-500 break-all">{log.user_id || 'N/A'}</div>
                        {roleLabel && (
                          <div className="mt-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200 w-fit max-w-full break-words whitespace-normal uppercase">
                            {roleLabel}
                          </div>
                        )}
                      </div>

                      <div className="text-xs w-full min-w-0">
                        <span className="text-slate-500">Đối tượng: </span>
                        <span className="font-medium text-slate-700">{ENTITY_LABELS[log.entity_type] || log.entity_type}</span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs w-full min-w-0">
                        {renderDetails(log.details, true)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {!loading && logs.length > 0 && (
          <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between text-sm text-gray-500 w-full min-w-0">
            <div className="text-center sm:text-left w-full sm:w-auto truncate">
              Hiển thị {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total} nhật ký
            </div>
            <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end shrink-0">
              <button
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-1 sm:flex-none text-center"
              >
                Trang trước
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-1 sm:flex-none text-center"
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogsPage;
