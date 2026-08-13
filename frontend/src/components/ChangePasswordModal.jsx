import React, { useState } from 'react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Lock, Mail, X, KeyRound } from 'lucide-react';

export default function ChangePasswordModal({ onClose, email: propEmail }) {
  const { showToast } = useToast();

  const [form, setForm] = useState({
    email: propEmail || '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [responseType, setResponseType] = useState(''); // 'success' | 'error'

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setResponseMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResponseMessage('');

    if (!form.email) {
      setResponseMessage('Vui lòng nhập email tài khoản');
      setResponseType('error');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setResponseMessage('Mật khẩu mới và xác nhận không khớp');
      setResponseType('error');
      return;
    }
    if (form.newPassword === form.oldPassword) {
      setResponseMessage('Mật khẩu mới không được trùng với mật khẩu hiện tại');
      setResponseType('error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/change-password', {
        email: form.email,
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });

      if (res.data && res.data.success) {
        const msg = res.data.message || 'Đổi mật khẩu thành công!';
        setResponseMessage(msg);
        setResponseType('success');
        showToast(msg, 'success');
        // Đóng modal sau 2 giây
        setTimeout(() => onClose(), 2000);
      } else {
        const msg = res.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu';
        setResponseMessage(msg);
        setResponseType('error');
        showToast(msg, 'error');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu';
      setResponseMessage(msg);
      setResponseType('error');
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5 sm:p-8 relative">
        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 focus:outline-none"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <KeyRound className="w-7 h-7 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-extrabold text-center text-slate-900 mb-1">
          Đổi mật khẩu
        </h2>
        <p className="text-center text-sm text-slate-500 mb-6">
          Nhập thông tin để thay đổi mật khẩu tài khoản
        </p>

        {/* Thông báo kết quả */}
        {responseMessage && (
          <div
            className={`mb-4 rounded-md p-3 text-sm font-medium ${
              responseType === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
            role="alert"
          >
            {responseMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email tài khoản
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="your@email.com"
                className="block w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Mật khẩu cũ */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Mật khẩu hiện tại
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="password"
                name="oldPassword"
                value={form.oldPassword}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="block w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Mật khẩu mới */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Mật khẩu mới
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Tối thiểu 6 ký tự"
                className="block w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Xác nhận mật khẩu mới */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Nhập lại mật khẩu mới"
                className="block w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 bg-slate-100 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-200 focus:outline-none"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-2 px-4 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
