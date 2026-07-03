import React, { useState, useEffect } from 'react';
import { Store, Package, Sparkles, CreditCard, Settings2, Save, Upload, AlertCircle } from 'lucide-react';
import { getSettings, updateSettings, uploadStoreLogo } from '../services/settingService';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../contexts/ToastContext';

export default function SettingsPage() {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('store');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    store_name: '',
    store_phone: '',
    store_email: '',
    store_address: '',
    store_logo_url: '',
    low_stock_warning_days: 14,
    default_reorder_level: 10,
    auto_stock_alert_enabled: true,
    allow_negative_stock: false,
    ai_enabled: true,
    ai_provider: 'Google Gemini',
    ai_model: 'gemini-1.5-pro',
    forecast_days: 14,
    payos_enabled: true,
    bank_name: '',
    bank_account_no: '',
    bank_account_name: '',
    currency: 'VND',
    date_format: 'DD/MM/YYYY',
    maintenance_mode: false,
  });

  const fileInputRef = React.useRef(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await getSettings();
      if (res.data) {
        setFormData(res.data);
      }
    } catch (error) {
      console.error(error);
      // Not throwing error toast on load in case the table is empty and backend throws 404 (handled by default seed ideally)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await uploadStoreLogo(file);
      setFormData(prev => ({ ...prev, store_logo_url: res.data.store_logo_url }));
      showToast({ type: 'success', title: 'Thành công', message: 'Cập nhật logo thành công' });
    } catch (error) {
      console.error(error);
      showToast({ type: 'error', title: 'Lỗi', message: 'Không thể upload logo' });
    }
    e.target.value = '';
  };

  const handleSaveClick = (e) => {
    e.preventDefault();
    setIsConfirmOpen(true);
  };

  const confirmSave = async () => {
    setIsConfirmOpen(false);
    setSaving(true);
    try {
      await updateSettings(formData);
      showToast({ type: 'success', title: 'Thành công', message: 'Cập nhật cài đặt thành công' });
      await loadSettings();
    } catch (error) {
      console.error(error);
      showToast({ type: 'error', title: 'Lỗi', message: 'Không thể lưu cấu hình' });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'store', label: 'Thông tin cửa hàng', icon: Store },
    { id: 'inventory', label: 'Cài đặt tồn kho', icon: Package },
    { id: 'ai', label: 'Cài đặt AI', icon: Sparkles },
    { id: 'payment', label: 'Cài đặt thanh toán', icon: CreditCard },
    { id: 'system', label: 'Cài đặt hệ thống', icon: Settings2 },
  ];

  if (loading) return <div className="p-12 text-center text-slate-500">Đang tải cài đặt...</div>;

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cài đặt</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý cấu hình toàn hệ thống</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 shrink-0 bg-white border border-slate-200 rounded-xl shadow-sm p-3 flex flex-col gap-1 h-fit">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm">
          <form onSubmit={handleSaveClick}>
            <div className="p-6 space-y-6 min-h-[400px]">
              {activeTab === 'store' && (
                <div className="space-y-5">
                  <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Thông tin cửa hàng</h2>
                  
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      {formData.store_logo_url ? (
                        <img src={formData.store_logo_url} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    <div>
                      <input type="file" ref={fileInputRef} onChange={handleLogoChange} accept="image/*" className="hidden" />
                      <button type="button" onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium">
                        <Upload className="w-4 h-4" /> Đổi Logo
                      </button>
                      <p className="text-xs text-slate-500 mt-2">Hỗ trợ JPG, PNG. Tối đa 2MB.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tên cửa hàng</label>
                      <input type="text" name="store_name" value={formData.store_name} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                      <input type="text" name="store_phone" value={formData.store_phone} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                      <input type="email" name="store_email" value={formData.store_email} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ</label>
                      <input type="text" name="store_address" value={formData.store_address} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'inventory' && (
                <div className="space-y-5">
                  <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Cài đặt tồn kho</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Mức tồn kho tối thiểu mặc định (Sản phẩm mới)</label>
                      <input type="number" name="default_reorder_level" value={formData.default_reorder_level} onChange={handleChange} min="0" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Số ngày cảnh báo hàng tồn kho lâu (Ngày)</label>
                      <input type="number" name="low_stock_warning_days" value={formData.low_stock_warning_days} onChange={handleChange} min="0" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                  </div>
                  <div className="space-y-3 mt-4">
                    <label className="flex items-center gap-3">
                      <input type="checkbox" name="auto_stock_alert_enabled" checked={formData.auto_stock_alert_enabled} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded border-slate-300" />
                      <span className="text-sm text-slate-700 font-medium">Bật cảnh báo tự động khi sắp hết hàng</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" name="allow_negative_stock" checked={formData.allow_negative_stock} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded border-slate-300" />
                      <span className="text-sm text-slate-700 font-medium">Cho phép xuất kho âm (Bán trước nhập sau)</span>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="space-y-5">
                  <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Cài đặt Trí tuệ Nhân tạo (AI)</h2>
                  <div className="mb-4">
                    <label className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <input type="checkbox" name="ai_enabled" checked={formData.ai_enabled} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded border-slate-300" />
                      <span className="text-sm text-blue-900 font-medium">Bật tính năng Trợ lý AI và Dự báo</span>
                    </label>
                  </div>
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-5 ${!formData.ai_enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nhà cung cấp AI</label>
                      <select name="ai_provider" value={formData.ai_provider} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                        <option value="Google Gemini">Google Gemini</option>
                        <option value="OpenAI">OpenAI</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Mô hình AI</label>
                      <input type="text" name="ai_model" value={formData.ai_model} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Chu kỳ dự báo (Ngày)</label>
                      <input type="number" name="forecast_days" value={formData.forecast_days} onChange={handleChange} min="1" max="90" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'payment' && (
                <div className="space-y-5">
                  <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Cài đặt thanh toán</h2>
                  <div className="mb-4">
                    <label className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <input type="checkbox" name="payos_enabled" checked={formData.payos_enabled} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded border-slate-300" />
                      <span className="text-sm text-blue-900 font-medium">Bật thanh toán chuyển khoản (payOS)</span>
                    </label>
                    {formData.payos_enabled && (
                      <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5 ml-1">
                        <AlertCircle className="w-3.5 h-3.5 text-blue-500"/>
                        Lưu ý: Khóa API (API Key, Client ID) của payOS được cấu hình trực tiếp trong tệp `.env` của Backend để bảo mật.
                      </div>
                    )}
                  </div>
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-5 ${!formData.payos_enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tên ngân hàng (Hiển thị hóa đơn)</label>
                      <input type="text" name="bank_name" value={formData.bank_name} onChange={handleChange} placeholder="Ví dụ: MB Bank" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tên chủ tài khoản</label>
                      <input type="text" name="bank_account_name" value={formData.bank_account_name} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Số tài khoản</label>
                      <input type="text" name="bank_account_no" value={formData.bank_account_no} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'system' && (
                <div className="space-y-5">
                  <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Cài đặt hệ thống</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Loại tiền tệ</label>
                      <select name="currency" value={formData.currency} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                        <option value="VND">VND - Việt Nam Đồng</option>
                        <option value="USD">USD - Đô la Mỹ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Định dạng ngày</label>
                      <select name="date_format" value={formData.date_format} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl">
                    <h3 className="text-red-800 font-bold text-sm mb-2">Khu vực nguy hiểm</h3>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" name="maintenance_mode" checked={formData.maintenance_mode} onChange={handleChange} className="w-4 h-4 text-red-600 rounded border-red-300" />
                      <span className="text-sm text-red-900 font-medium">Bật chế độ bảo trì (Ngưng toàn bộ giao dịch mua bán)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end gap-3">
              <button 
                type="button" 
                onClick={loadSettings}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium shadow-sm transition-colors"
              >
                Hủy thay đổi
              </button>
              <button 
                type="submit" 
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> 
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Xác nhận lưu cấu hình"
        message="Những thay đổi này sẽ áp dụng ngay lập tức cho toàn bộ hệ thống. Bạn có chắc chắn muốn lưu?"
        confirmText="Lưu thay đổi"
        cancelText="Hủy"
        onConfirm={confirmSave}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
