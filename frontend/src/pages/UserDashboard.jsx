import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Eye, Pencil, Trash2, X, Shield, Lock, Unlock, Users, ShieldAlert, CheckCircle2, UserCheck } from 'lucide-react';
import { getUsers, deleteUser, createUser, updateUser, updateUserStatus } from '../services/userService';
import StatCard from '../components/StatCard';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../contexts/ToastContext';

export default function UserDashboard() {
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'Nhân viên bán hàng',
    status: 'Đang hoạt động'
  });

  // View Modal
  const [viewingUser, setViewingUser] = useState(null);

  // Confirm Modal
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, user: null, action: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers({ limit: 1000, page: 1 });
      setUsers(res.data || []);
    } catch (error) {
      console.error(error);
      showToast({ type: 'error', title: 'Lỗi', message: 'Không thể tải danh sách người dùng' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchName = u.full_name?.toLowerCase().includes(query);
        const matchEmail = u.email?.toLowerCase().includes(query);
        const matchPhone = u.phone?.toLowerCase().includes(query);
        if (!matchName && !matchEmail && !matchPhone) return false;
      }
      if (selectedRole && u.role !== selectedRole) return false;
      if (selectedStatus && u.status !== selectedStatus) return false;
      return true;
    });
  }, [users, searchTerm, selectedRole, selectedStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredUsers.length]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({ full_name: '', email: '', phone: '', role: 'Nhân viên bán hàng', status: 'Đang hoạt động' });
    setIsFormOpen(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'Nhân viên bán hàng',
      status: user.status || 'Đang hoạt động'
    });
    setIsFormOpen(true);
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showToast({ type: 'error', title: 'Lỗi', message: 'Email không đúng định dạng' });
      return;
    }

    const phoneRegex = /^(0|84)(3|5|7|8|9)[0-9]{8}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      showToast({ type: 'error', title: 'Lỗi', message: 'Số điện thoại không hợp lệ' });
      return;
    }

    if (isProcessing) return;
    setIsProcessing(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.user_id, formData);
        showToast({ type: 'success', title: 'Thành công', message: 'Cập nhật người dùng thành công' });
      } else {
        await createUser(formData);
        showToast({ type: 'success', title: 'Thành công', message: 'Thêm người dùng mới thành công' });
      }
      setIsFormOpen(false);
      loadUsers();
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi lưu người dùng';
      showToast({ type: 'error', title: 'Lỗi', message: msg });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAction = async () => {
    if (!confirmConfig.user) return;
    setIsProcessing(true);
    try {
      if (confirmConfig.action === 'delete') {
        await deleteUser(confirmConfig.user.user_id);
        showToast({ type: 'success', title: 'Thành công', message: 'Đã xóa người dùng' });
      } else if (confirmConfig.action === 'lock') {
        await updateUserStatus(confirmConfig.user.user_id, 'Tạm khóa');
        showToast({ type: 'success', title: 'Thành công', message: 'Đã khóa tài khoản' });
      } else if (confirmConfig.action === 'unlock') {
        await updateUserStatus(confirmConfig.user.user_id, 'Đang hoạt động');
        showToast({ type: 'success', title: 'Thành công', message: 'Đã mở khóa tài khoản' });
      }
      setConfirmConfig({ isOpen: false, user: null, action: '' });
      loadUsers();
    } catch (error) {
      console.error(error);
      showToast({ type: 'error', title: 'Lỗi', message: 'Hành động thất bại' });
    } finally {
      setIsProcessing(false);
    }
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'Đang hoạt động').length,
    locked: users.filter(u => u.status === 'Tạm khóa').length,
    admins: users.filter(u => u.role === 'Quản trị viên').length
  };

  const roles = ['Quản trị viên', 'Chủ cửa hàng', 'Nhân viên kho', 'Nhân viên bán hàng'];
  const statuses = ['Đang hoạt động', 'Tạm khóa'];

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Người dùng</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý tài khoản và phân quyền hệ thống</p>
        </div>
        <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm">
          <Plus className="w-4 h-4" /> Thêm người dùng
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} iconColorClass="bg-blue-50 text-blue-600" label="Tổng người dùng" value={stats.total} />
        <StatCard icon={CheckCircle2} iconColorClass="bg-green-50 text-green-600" label="Đang hoạt động" value={stats.active} />
        <StatCard icon={ShieldAlert} iconColorClass="bg-red-50 text-red-600" label="Tạm khóa" value={stats.locked} />
        <StatCard icon={Shield} iconColorClass="bg-purple-50 text-purple-600" label="Quản trị viên" value={stats.admins} />
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm theo tên, email, số điện thoại..."
            className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedRole}
          onChange={e => setSelectedRole(e.target.value)}
        >
          <option value="">Tất cả vai trò</option>
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Đang tải dữ liệu...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">Không tìm thấy người dùng phù hợp</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                  <th className="p-4">Người dùng</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Số điện thoại</th>
                  <th className="p-4">Vai trò</th>
                  <th className="p-4 text-center">Trạng thái</th>
                  <th className="p-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {paginatedUsers.map(user => (
                  <tr key={user.user_id} className="hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        {user.full_name?.charAt(0).toUpperCase()}
                      </div>
                      {user.full_name}
                    </td>
                    <td className="p-4 text-slate-600">{user.email}</td>
                    <td className="p-4 text-slate-600">{user.phone || 'N/A'}</td>
                    <td className="p-4 text-slate-600">{user.role}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${user.status === 'Đang hoạt động' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setViewingUser(user)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Xem">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEdit(user)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded" title="Sửa">
                          <Pencil className="w-4 h-4" />
                        </button>
                        {user.status === 'Đang hoạt động' ? (
                          <button onClick={() => setConfirmConfig({ isOpen: true, user, action: 'lock' })} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded" title="Khóa">
                            <Lock className="w-4 h-4" />
                          </button>
                        ) : (
                          <button onClick={() => setConfirmConfig({ isOpen: true, user, action: 'unlock' })} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Mở khóa">
                            <Unlock className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => setConfirmConfig({ isOpen: true, user, action: 'delete' })} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Xóa">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filteredUsers.length > 0 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="text-sm text-slate-500">
              Hiển thị <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> đến <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> trong <span className="font-medium">{filteredUsers.length}</span>
            </div>
            {totalPages > 1 && (
              <div className="flex gap-1">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 border border-slate-200 bg-white rounded text-sm disabled:opacity-50">Trước</button>
                <div className="px-3 py-1 text-sm font-medium">{currentPage} / {totalPages}</div>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 border border-slate-200 bg-white rounded text-sm disabled:opacity-50">Sau</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold">{editingUser ? 'Sửa thông tin người dùng' : 'Thêm người dùng mới'}</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSaveForm} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên *</label>
                <input required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vai trò</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 border rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">Hủy</button>
                <button type="submit" disabled={isProcessing} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold">Chi tiết người dùng</h2>
              <button onClick={() => setViewingUser(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Họ và tên</span><span className="font-medium">{viewingUser.full_name}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Email</span><span className="font-medium">{viewingUser.email}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Số điện thoại</span><span className="font-medium">{viewingUser.phone || 'N/A'}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Vai trò</span><span className="font-medium">{viewingUser.role}</span></div>
              <div className="flex justify-between pb-2"><span className="text-slate-500">Trạng thái</span><span className="font-medium">{viewingUser.status}</span></div>
            </div>
            <div className="px-6 py-4 border-t bg-slate-50 text-right rounded-b-2xl">
              <button onClick={() => setViewingUser(null)} className="px-4 py-2 border bg-white rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.action === 'delete' ? 'Xác nhận xóa' : confirmConfig.action === 'lock' ? 'Xác nhận khóa' : 'Mở khóa tài khoản'}
        message={
          confirmConfig.action === 'delete' ? `Bạn có chắc muốn xóa người dùng ${confirmConfig.user?.full_name}?` :
          confirmConfig.action === 'lock' ? `Bạn có chắc muốn khóa tài khoản ${confirmConfig.user?.full_name}?` :
          `Xác nhận mở khóa cho ${confirmConfig.user?.full_name}?`
        }
        confirmText={confirmConfig.action === 'delete' ? 'Xóa' : 'Đồng ý'}
        cancelText="Hủy"
        onConfirm={handleAction}
        onCancel={() => setConfirmConfig({ isOpen: false, user: null, action: '' })}
        isDanger={confirmConfig.action === 'delete' || confirmConfig.action === 'lock'}
      />
    </div>
  );
}
