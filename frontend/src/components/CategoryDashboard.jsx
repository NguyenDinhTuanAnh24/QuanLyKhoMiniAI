import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, LayoutGrid, CheckCircle2, AlertCircle, List, Eye, Pencil, Trash2, X } from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/categoryService';
import StatCard from './StatCard';
import ConfirmModal from './ConfirmModal';
import PageContainer from './layout/PageContainer';
import DataFoundationSkeleton from './skeletons/DataFoundationSkeleton';
import { useToast } from '../contexts/ToastContext';

export default function CategoryDashboard() {
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    page: 1,
    limit: 10
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    category_name: '',
    category_name_en: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { showToast } = useToast();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const result = await getCategories(filters);
      setCategories(result.data);
      setMeta(result.meta);
    } catch (error) {
      console.error("Failed to load categories", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [filters]);

  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ category_name: '', category_name_en: '', description: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      category_name: cat.category_name || '',
      category_name_en: cat.category_name_en || '',
      description: cat.description || ''
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
    if (!formData.category_name) {
      showToast("Tên danh mục là bắt buộc", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.category_id, formData);
        showToast("Cập nhật danh mục thành công", "success");
      } else {
        await createCategory(formData);
        showToast("Thêm danh mục thành công", "success");
      }
      closeModal();
      loadCategories();
    } catch (error) {
      showToast(error.response?.data?.error?.message || error.response?.data?.message || "Đã xảy ra lỗi", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id) => {
    setCategoryToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteConfirmOpen(false);
    try {
      await deleteCategory(categoryToDelete);
      showToast("Xóa danh mục thành công", "success");
      loadCategories();
    } catch (error) {
      showToast(error.response?.data?.error?.message || error.response?.data?.message || "Đã xảy ra lỗi khi xóa", "error");
    }
  };

  // Stats
  const totalCount = meta?.pagination?.total || 0;
  const activeCount = categories.filter(c => (c.products?.[0]?.count || 0) > 0).length;
  const emptyCount = categories.filter(c => (c.products?.[0]?.count || 0) === 0).length;

  if (loading && categories.length === 0 && !filters.search) {
    return <DataFoundationSkeleton title="Danh mục sản phẩm" subtitle="Tổ chức sản phẩm theo từng nhóm hàng hóa" />;
  }

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Danh mục sản phẩm</h1>
          <p className="text-slate-500 text-sm mt-1">Tổ chức sản phẩm theo từng nhóm hàng hóa</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Thêm danh mục
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={LayoutGrid} iconColorClass="bg-blue-50 text-blue-600" label="Tổng danh mục" value={totalCount} trend="up" trendLabel="+2" trendColorClass="bg-green-50 text-green-700" />
        <StatCard icon={CheckCircle2} iconColorClass="bg-green-50 text-green-600" label="Đang sử dụng" value={activeCount} trend="up" trendLabel="83%" trendColorClass="bg-green-50 text-green-700" />
        <StatCard icon={AlertCircle} iconColorClass="bg-amber-50 text-amber-600" label="Chưa có sản phẩm" value={emptyCount} trendLabel="Cần bổ sung" trendColorClass="bg-amber-50 text-amber-700" />
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-2 justify-between">
        <div className="relative flex-1 md:max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm danh mục..."
            className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={filters.search}
            onChange={handleSearchChange}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
          Bộ lọc
        </button>
      </div>

      {/* Table & Mobile List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {categories.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Không tìm thấy danh mục nào</div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs tracking-wider text-slate-500 font-medium">
                    <th className="p-4">Tên danh mục</th>
                    <th className="p-4">Mô tả</th>
                    <th className="p-4 text-center">Số SP</th>
                    <th className="p-4 text-center">Ngày tạo</th>
                    <th className="p-4 text-center">Trạng thái</th>
                    <th className="p-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {categories.map(category => {
                    const isActive = !category.deleted_at;
                    return (
                      <tr key={category.category_id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4 font-medium text-slate-900">{category.category_name}</td>
                        <td className="p-4 text-slate-500 max-w-xs truncate" title={category.description}>{category.description || '-'}</td>
                        <td className="p-4 text-center font-medium text-slate-700">
                          {category.products?.[0]?.count || 0}
                        </td>
                        <td className="p-4 text-center text-slate-500">
                          {category.created_at ? new Date(category.created_at).toLocaleDateString('vi-VN') : '-'}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                            isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {isActive ? 'Đang dùng' : 'Đã xóa'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-3 text-sm">
                            <button className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors font-medium">
                              <Eye className="w-4 h-4" /> Xem SP
                            </button>
                            <button onClick={() => openEditModal(category)} className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors font-medium">
                              <Pencil className="w-4 h-4" /> Sửa
                            </button>
                            <button onClick={() => handleDeleteClick(category.category_id)} className="flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors font-medium">
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
              {categories.map(category => {
                const isActive = !category.deleted_at;
                return (
                  <div key={category.category_id} className="p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 truncate">{category.category_name}</h4>
                        {category.description && (
                          <p className="text-sm text-slate-500 line-clamp-2 mt-1">{category.description}</p>
                        )}
                      </div>
                      <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                        isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {isActive ? 'Đang dùng' : 'Đã xóa'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <div>Số SP: <span className="font-medium text-slate-900">{category.products?.[0]?.count || 0}</span></div>
                      <div>{category.created_at ? new Date(category.created_at).toLocaleDateString('vi-VN') : '-'}</div>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-50 mt-1">
                      <button className="flex-1 flex justify-center items-center gap-1 py-1.5 bg-slate-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors font-medium text-sm">
                        <Eye className="w-4 h-4" /> Xem SP
                      </button>
                      <button onClick={() => openEditModal(category)} className="flex-1 flex justify-center items-center gap-1 py-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium text-sm">
                        <Pencil className="w-4 h-4" /> Sửa
                      </button>
                      <button onClick={() => handleDeleteClick(category.category_id)} className="flex-1 flex justify-center items-center gap-1 py-1.5 bg-slate-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors font-medium text-sm">
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

      {/* Modal Thêm/Sửa */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên danh mục *</label>
                <input 
                  type="text" 
                  name="category_name"
                  value={formData.category_name}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên tiếng Anh (tuỳ chọn)</label>
                <input 
                  type="text" 
                  name="category_name_en"
                  value={formData.category_name_en}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium">
                  Hủy
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
                  {isSubmitting ? 'Đang lưu...' : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa danh mục này không?"
        confirmText="Xóa"
        cancelText="Hủy"
        isDanger={true}
      />
    </PageContainer>
  );
}
