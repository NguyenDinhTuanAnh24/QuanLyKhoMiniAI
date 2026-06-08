import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, LayoutGrid, CheckCircle2, AlertCircle, List, Eye, Pencil, Trash2, X } from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/categoryService';
import StatCard from './StatCard';

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
      alert("Tên danh mục là bắt buộc");
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.category_id, formData);
      } else {
        await createCategory(formData);
      }
      closeModal();
      loadCategories();
    } catch (error) {
      alert(error.response?.data?.message || "Đã xảy ra lỗi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;
    try {
      await deleteCategory(id);
      loadCategories();
    } catch (error) {
      alert(error.response?.data?.message || "Đã xảy ra lỗi khi xóa");
    }
  };

  // Stats
  const totalCount = meta?.pagination?.total || 0;
  const activeCount = categories.filter(c => (c.products?.[0]?.count || 0) > 0).length;
  const emptyCount = categories.filter(c => (c.products?.[0]?.count || 0) === 0).length;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
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

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
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
              {loading ? (
                <tr><td colSpan="6" className="text-center p-8 text-slate-500">Đang tải dữ liệu...</td></tr>
              ) : categories.length === 0 ? (
                <tr><td colSpan="6" className="text-center p-8 text-slate-500">Không tìm thấy danh mục nào</td></tr>
              ) : (
                categories.map(category => {
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
                          <button onClick={() => handleDelete(category.category_id)} className="flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors font-medium">
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
    </div>
  );
}
