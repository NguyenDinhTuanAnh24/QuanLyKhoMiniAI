import React, { useState, useEffect } from 'react';
import { Search, Plus, Truck, CheckCircle2, FileText, DollarSign, Eye, Pencil, Trash2, X } from 'lucide-react';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../services/supplierService';
import StatCard from './StatCard';
import ConfirmModal from './ConfirmModal';
import PageContainer from './layout/PageContainer';
import DataFoundationSkeleton from './skeletons/DataFoundationSkeleton';
import { useToast } from '../contexts/ToastContext';

export default function SupplierDashboard() {
  const [suppliers, setSuppliers] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    page: 1,
    limit: 10
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [formData, setFormData] = useState({
    supplier_name: '',
    phone: '',
    email: '',
    address: '',
    note: '',
    status: 'Đang hợp tác'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { showToast } = useToast();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const result = await getSuppliers(filters);
      setSuppliers(result.data);
      setMeta(result.meta);
    } catch (error) {
      console.error("Failed to load suppliers", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [filters]);

  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const openAddModal = () => {
    setEditingSupplier(null);
    setIsViewOnly(false);
    setFormData({ 
      supplier_name: '', 
      phone: '', 
      email: '', 
      address: '', 
      note: '', 
      status: 'Đang hợp tác' 
    });
    setIsModalOpen(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setIsViewOnly(false);
    setFormData({
      supplier_name: supplier.supplier_name || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      note: supplier.note || '',
      status: supplier.status || 'Đang hợp tác'
    });
    setIsModalOpen(true);
  };

  const openViewModal = (supplier) => {
    setEditingSupplier(supplier);
    setIsViewOnly(true);
    setFormData({
      supplier_name: supplier.supplier_name || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      note: supplier.note || '',
      status: supplier.status || 'Đang hợp tác'
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleFormChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplier_name) {
      showToast("Tên nhà cung cấp là bắt buộc", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.supplier_id, formData);
        showToast("Cập nhật nhà cung cấp thành công", "success");
      } else {
        await createSupplier(formData);
        showToast("Thêm nhà cung cấp thành công", "success");
      }
      closeModal();
      loadSuppliers();
    } catch (error) {
      showToast(error.response?.data?.error?.message || error.response?.data?.message || "Đã xảy ra lỗi", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id) => {
    setSupplierToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteConfirmOpen(false);
    try {
      await deleteSupplier(supplierToDelete);
      showToast("Xóa nhà cung cấp thành công", "success");
      loadSuppliers();
    } catch (error) {
      showToast(error.response?.data?.error?.message || error.response?.data?.message || "Đã xảy ra lỗi khi xóa", "error");
    }
  };

  // Stats (Using simple estimates based on current page if full data is missing)
  const totalCount = meta?.pagination?.total || 0;
  const activeCount = suppliers.filter(s => s.status !== 'Ngừng hợp tác' && !s.deleted_at).length;
  
  // Format Currency
  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  const formatCompactCurrency = (val) => {
    if (val >= 1e9) return `đ ${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `đ ${(val / 1e6).toFixed(1)}M`;
    return formatCurrency(val);
  };

  if (loading && suppliers.length === 0 && !filters.search) {
    return <DataFoundationSkeleton title="Nhà cung cấp" subtitle="Quản lý thông tin đối tác cung cấp hàng hóa" />;
  }

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nhà cung cấp</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý thông tin đối tác cung cấp hàng hóa</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Thêm NCC
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Truck} iconColorClass="bg-blue-50 text-blue-600" label="Tổng nhà cung cấp" value={totalCount} trend="up" trendLabel="+3 tháng này" trendColorClass="bg-green-50 text-green-700" />
        <StatCard icon={CheckCircle2} iconColorClass="bg-green-50 text-green-600" label="Đang hoạt động" value={activeCount} trend="up" trendLabel="80%" trendColorClass="bg-green-50 text-green-700" />
        <StatCard icon={FileText} iconColorClass="bg-slate-100 text-slate-600" label="Phiếu nhập tháng này" value={0} trend="up" trendLabel="+12%" trendColorClass="bg-green-50 text-green-700" />
        <StatCard icon={DollarSign} iconColorClass="bg-blue-50 text-blue-600" label="Tổng giá trị nhập" value={formatCompactCurrency(0)} trend="up" trendLabel="+8.5%" trendColorClass="bg-green-50 text-green-700" />
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-2">
        <div className="relative flex-1 md:max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm nhà cung cấp..."
            className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={filters.search}
            onChange={handleSearchChange}
          />
        </div>

        <select 
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
        >
          <option value="">Trạng thái</option>
          <option value="Đang hợp tác">Đang hợp tác</option>
          <option value="Ngừng hợp tác">Ngừng hợp tác</option>
        </select>
      </div>

      {/* Table & Mobile List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {suppliers.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Không tìm thấy nhà cung cấp nào</div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs tracking-wider text-slate-500 font-medium">
                <th className="p-4">Nhà cung cấp</th>
                <th className="p-4">Số điện thoại</th>
                <th className="p-4">Email</th>
                <th className="p-4">Địa chỉ</th>
                <th className="p-4 text-center">Số SP</th>
                <th className="p-4 text-right">Tổng nhập</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
                {suppliers.map(supplier => {
                  const isDeleted = !!supplier.deleted_at;
                  const isInactive = supplier.status === 'Ngừng hợp tác';
                  const displayStatus = isDeleted ? 'Đã xóa' : (supplier.status || 'Hoạt động');
                  
                  let badgeClass = 'bg-green-50 text-green-700 border-green-200';
                  if (isDeleted || isInactive) badgeClass = 'bg-red-50 text-red-700 border-red-200';
                  else if (supplier.status && supplier.status !== 'Đang hợp tác') badgeClass = 'bg-slate-100 text-slate-600 border-slate-200';

                  return (
                    <tr key={supplier.supplier_id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4 font-medium text-slate-900">{supplier.supplier_name}</td>
                      <td className="p-4 text-slate-600">{supplier.phone || '-'}</td>
                      <td className="p-4 text-slate-600">{supplier.email || '-'}</td>
                      <td className="p-4 text-slate-500 max-w-xs truncate" title={supplier.address}>{supplier.address || '-'}</td>
                      <td className="p-4 text-center font-medium text-slate-700">
                        {supplier.products?.[0]?.count || 0}
                      </td>
                      <td className="p-4 text-right font-medium text-slate-900">
                        đ 0
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${badgeClass}`}>
                          {displayStatus}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-3 text-sm">
                          <button onClick={() => openViewModal(supplier)} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors font-medium">
                            <Eye className="w-4 h-4" /> Chi tiết
                          </button>
                          <button onClick={() => openEditModal(supplier)} className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors font-medium">
                            <Pencil className="w-4 h-4" /> Sửa
                          </button>
                          <button onClick={() => handleDeleteClick(supplier.supplier_id)} className="flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors font-medium">
                            <Trash2 className="w-4 h-4" /> Xoá
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
              </table>
            </div>
            
            {/* Mobile List */}
            <div className="md:hidden flex flex-col divide-y divide-slate-100">
              {suppliers.map(supplier => {
                const isDeleted = !!supplier.deleted_at;
              const isInactive = supplier.status === 'Ngừng hợp tác';
              const displayStatus = isDeleted ? 'Đã xóa' : (supplier.status || 'Hoạt động');
              
              let badgeClass = 'bg-green-50 text-green-700 border-green-200';
              if (isDeleted || isInactive) badgeClass = 'bg-red-50 text-red-700 border-red-200';
              else if (supplier.status && supplier.status !== 'Đang hợp tác') badgeClass = 'bg-slate-100 text-slate-600 border-slate-200';

              return (
                <div key={supplier.supplier_id} className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-900 truncate">{supplier.supplier_name}</h4>
                      <p className="text-sm text-slate-500 mt-1 truncate">{supplier.phone || 'Chưa có SĐT'}</p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${badgeClass}`}>
                      {displayStatus}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-slate-500 text-xs mb-0.5">Số SP</p>
                      <p className="font-medium text-slate-900">{supplier.products?.[0]?.count || 0}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-500 text-xs mb-0.5">Tổng nhập</p>
                      <p className="font-medium text-slate-900">đ 0</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-50 mt-1">
                    <button onClick={() => openViewModal(supplier)} className="flex-1 flex justify-center items-center gap-1 py-1.5 bg-slate-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors font-medium text-sm">
                      <Eye className="w-4 h-4" /> Chi tiết
                    </button>
                    <button onClick={() => openEditModal(supplier)} className="flex-1 flex justify-center items-center gap-1 py-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium text-sm">
                      <Pencil className="w-4 h-4" /> Sửa
                    </button>
                    <button onClick={() => handleDeleteClick(supplier.supplier_id)} className="flex-1 flex justify-center items-center gap-1 py-1.5 bg-slate-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors font-medium text-sm">
                      <Trash2 className="w-4 h-4" /> Xóa
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
        )}
        
        {/* Pagination */}
        {meta?.pagination && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="text-sm text-slate-500">
              Hiển thị <span className="font-medium text-slate-900">{(filters.page - 1) * filters.limit + 1}</span> đến <span className="font-medium text-slate-900">{Math.min(filters.page * filters.limit, meta.pagination.total)}</span> trong tổng số <span className="font-medium text-slate-900">{meta.pagination.total}</span>
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

      {/* Modal Thêm/Sửa/Chi tiết */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold text-slate-900">
                {isViewOnly ? 'Chi tiết nhà cung cấp' : editingSupplier ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="supplier-form" onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tên nhà cung cấp *</label>
                  <input 
                    type="text" 
                    name="supplier_name"
                    value={formData.supplier_name}
                    onChange={handleFormChange}
                    readOnly={isViewOnly}
                    className={`w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isViewOnly ? 'bg-slate-50' : 'bg-white'}`}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                    <input 
                      type="text" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleFormChange}
                      readOnly={isViewOnly}
                      className={`w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isViewOnly ? 'bg-slate-50' : 'bg-white'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      readOnly={isViewOnly}
                      className={`w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isViewOnly ? 'bg-slate-50' : 'bg-white'}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ</label>
                  <input 
                    type="text" 
                    name="address"
                    value={formData.address}
                    onChange={handleFormChange}
                    readOnly={isViewOnly}
                    className={`w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isViewOnly ? 'bg-slate-50' : 'bg-white'}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                  <select 
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    disabled={isViewOnly}
                    className={`w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isViewOnly ? 'bg-slate-50' : 'bg-white'}`}
                  >
                    <option value="Đang hợp tác">Đang hợp tác</option>
                    <option value="Ngừng hợp tác">Ngừng hợp tác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                  <textarea 
                    name="note"
                    value={formData.note}
                    onChange={handleFormChange}
                    readOnly={isViewOnly}
                    rows="3"
                    className={`w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none ${isViewOnly ? 'bg-slate-50' : 'bg-white'}`}
                  ></textarea>
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={closeModal} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium">
                {isViewOnly ? 'Đóng' : 'Hủy'}
              </button>
              {!isViewOnly && (
                <button form="supplier-form" type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
                  {isSubmitting ? 'Đang lưu...' : 'Lưu lại'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa nhà cung cấp này không?"
        confirmText="Xóa"
        cancelText="Hủy"
        isDanger={true}
      />
    </PageContainer>
  );
}
