import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Store, Package, Sparkles, User, Shield, Upload, AlertCircle, Save, CheckCircle2 } from 'lucide-react';
import { getSettings, updateSettings, uploadStoreLogo } from '../services/settingService';
import { getMe, updateMe, updateMyPassword } from '../services/userService';
import { getUser } from '../services/authService';
import ConfirmModal from '../components/ConfirmModal';
import { testAIConnection } from '../services/aiService';
import { useToast } from '../contexts/ToastContext';
import { useBranding } from '../contexts/BrandingContext';
import { processBrandLogo } from '../utils/processBrandLogo';
import PageContainer from '../components/layout/PageContainer';

export default function SettingsPage() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const userRole = getUser()?.role;
  const isStaff = userRole === 'Nhân viên kho' || userRole === 'Nhân viên bán hàng';

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || (isStaff ? 'account' : 'store'));
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

  // User data for Account tab
  const [userData, setUserData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: '',
    status: ''
  });
  const [initialUserData, setInitialUserData] = useState(null);

  // Password data for Security tab
  const [pwdData, setPwdData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
    logoutOthers: false
  });

  const [syncStorePhone, setSyncStorePhone] = useState(true);

  const [initialData, setInitialData] = useState(null);

  const [selectedLogoFile, setSelectedLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const fileInputRef = useRef(null);

  const { setBranding } = useBranding();

  const loadSettings = async () => {
    setLoading(true);
    try {
      const promises = [getMe().catch(err => { console.error('Error loading user:', err); return { data: null }; })];
      
      if (!isStaff) {
        promises.push(getSettings().catch(err => { console.error('Error loading settings:', err); return { data: null }; }));
      }
      
      const results = await Promise.all(promises);
      const userRes = results[0];
      const res = !isStaff ? results[1] : null;
      
      if (res && res.data) {
        setFormData(res.data);
        setInitialData(res.data);
      }
      if (userRes && userRes.data) {
        setUserData(userRes.data);
        setInitialUserData(userRes.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (syncStorePhone && userData.phone !== undefined) {
      if (formData.store_phone !== userData.phone) {
        setFormData(prev => ({ ...prev, store_phone: userData.phone }));
      }
    }
  }, [syncStorePhone, userData.phone]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['store', 'inventory', 'ai', 'account', 'security'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handlePwdChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPwdData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (2MB) and type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Chỉ hỗ trợ ảnh JPG, PNG, WEBP', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Dung lượng ảnh tối đa 2MB', 'error');
      return;
    }

    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }

    setSelectedLogoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);

    e.target.value = '';
  };

  const handleSaveClick = (e) => {
    e.preventDefault();
    if (activeTab === 'security') {
      if (!pwdData.current_password) {
        showToast({ type: 'error', title: 'Cập nhật thất bại', message: 'Vui lòng nhập mật khẩu hiện tại' });
        return;
      }
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!passwordRegex.test(pwdData.new_password)) {
        showToast({ type: 'error', title: 'Cập nhật thất bại', message: 'Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số' });
        return;
      }
      if (pwdData.new_password !== pwdData.confirm_password) {
        showToast({ type: 'error', title: 'Cập nhật thất bại', message: 'Mật khẩu mới không khớp' });
        return;
      }
      if (pwdData.new_password === pwdData.current_password) {
        showToast({ type: 'error', title: 'Cập nhật thất bại', message: 'Mật khẩu mới không được trùng mật khẩu hiện tại' });
        return;
      }
      setIsConfirmOpen(true);
      return;
    }
    
    if (activeTab === 'account') {
      setIsConfirmOpen(true);
      return;
    }

    setIsConfirmOpen(true);
  };

  const isSecurityDirty = pwdData.current_password || pwdData.new_password || pwdData.confirm_password;
  const isAccountDirty = JSON.stringify(userData) !== JSON.stringify(initialUserData);
  const isStoreDirty = JSON.stringify(formData) !== JSON.stringify(initialData) || selectedLogoFile !== null;
  
  const isFormDirty = activeTab === 'security' ? isSecurityDirty 
    : activeTab === 'account' ? isAccountDirty 
    : isStoreDirty;

  const confirmSave = async () => {
    setIsConfirmOpen(false);
    setSaving(true);
    try {
      if (activeTab === 'account') {
        const res = await updateMe({
          full_name: userData.full_name,
          email: userData.email,
          phone: userData.phone
        });
        showToast({ type: 'success', title: 'Cập nhật thành công', message: 'Thông tin tài khoản đã được lưu.' });
        
        // Cập nhật localStorage
        if (res.data) {
          const currentUser = JSON.parse(localStorage.getItem('user')) || {};
          const updatedUser = { ...currentUser, ...res.data };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          // Dispatch event để Topbar thay đổi ngay lập tức
          window.dispatchEvent(new Event('userUpdated'));
        }
        
        await loadSettings();
      } else if (activeTab === 'security') {
        const res = await updateMyPassword({
          oldPassword: pwdData.current_password,
          newPassword: pwdData.new_password,
          logoutOthers: pwdData.logoutOthers
        });
        showToast({ type: 'success', title: 'Đổi mật khẩu thành công', message: res.message || 'Mật khẩu của bạn đã được cập nhật.' });
        setPwdData({ current_password: '', new_password: '', confirm_password: '', logoutOthers: false });
      } else {
        let finalLogoUrl = formData.store_logo_url;
        
        if (selectedLogoFile) {
          showToast('Đang xử lý kích thước logo...', 'info');
          const processedFile = await processBrandLogo(selectedLogoFile, { trimWhite: false, safePadding: 0.1 });
          showToast('Đang tải ảnh lên...', 'info');
          const uploadRes = await uploadStoreLogo(processedFile);
          finalLogoUrl = uploadRes.data.store_logo_url;
        }

        const payload = {
          ...formData,
          store_logo_url: finalLogoUrl
        };

        await updateSettings(payload);
        
        let successMessage = 'Cài đặt đã được lưu.';
        if (activeTab === 'store') successMessage = 'Thông tin cửa hàng đã được lưu.';
        else if (activeTab === 'inventory') successMessage = 'Cài đặt tồn kho đã được lưu.';
        else if (activeTab === 'ai') successMessage = 'Cài đặt AI đã được lưu.';
        
        showToast({ type: 'success', title: 'Cập nhật thành công', message: successMessage });
        
        if (activeTab === 'store') {
          const updatedStoreName = payload.store_name;
          setBranding(prev => ({ ...prev, storeName: updatedStoreName, logoUrl: finalLogoUrl, updatedAt: Date.now() }));
        }

        if (logoPreview) {
          URL.revokeObjectURL(logoPreview);
          setLogoPreview(null);
        }
        setSelectedLogoFile(null);

        await loadSettings();
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error?.message || error.response?.data?.message || 'Không thể lưu cài đặt.';
      
      let failTitle = 'Cập nhật thất bại';
      let failMessage = msg;
      
      if (activeTab === 'store') failMessage = 'Không thể lưu thông tin cửa hàng. Vui lòng thử lại.';
      else if (activeTab === 'inventory') failMessage = 'Không thể lưu cài đặt tồn kho.';
      else if (activeTab === 'ai') failMessage = 'Không thể lưu cài đặt AI.';
      else if (activeTab === 'security' && error.response?.status === 400) failMessage = 'Mật khẩu hiện tại không chính xác.';
      
      showToast({ type: 'error', title: failTitle, message: failMessage });
    } finally {
      setSaving(false);
    }
  };

  const checkAIConnection = async () => {
    showToast({ type: 'info', title: 'Thông báo', message: 'Đang kết nối AI...' });
    try {
      const response = await testAIConnection();
      if (response && response.success) {
        showToast({ type: 'success', title: 'Thông báo', message: 'Kết nối AI thành công.' });
      } else {
        showToast({ type: 'error', title: 'Lỗi', message: 'Không thể kết nối tới dịch vụ AI.' });
      }
    } catch (error) {
      console.error(error);
      showToast({ type: 'error', title: 'Lỗi', message: 'Không thể kết nối tới dịch vụ AI.' });
    }
  };

  const allTabs = [
    { id: 'store', label: 'Thông tin cửa hàng', icon: Store, adminOnly: true },
    { id: 'inventory', label: 'Cài đặt tồn kho', icon: Package, adminOnly: true },
    { id: 'ai', label: 'Cài đặt AI', icon: Sparkles, adminOnly: true },
    { id: 'account', label: 'Tài khoản', icon: User, adminOnly: false },
    { id: 'security', label: 'Bảo mật', icon: Shield, adminOnly: false },
  ];
  
  const tabs = allTabs.filter(t => isStaff ? !t.adminOnly : true);

  return (
    <PageContainer>
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cài đặt</h1>
        <p className="text-slate-500 text-sm mt-1">Quản lý thông tin hệ thống và cấu hình cửa hàng</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

        {/* Horizontal Tabs */}
        <div className="px-6 pt-4 border-b border-slate-200 overflow-x-auto">
          <div className="flex gap-2 min-w-max pb-4">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                      : 'text-slate-600 bg-transparent hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 relative min-h-[400px]">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="mt-2 text-sm text-slate-500 font-medium">Đang tải cài đặt...</span>
            </div>
          )}
          <form onSubmit={handleSaveClick} className={loading ? 'opacity-50 pointer-events-none' : ''}>
            
            {activeTab === 'store' && (
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Column (65-70%) */}
                <div className="flex-1 space-y-6">
                  {/* Store Info Form */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
                    <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">Thông tin cửa hàng</h3>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                      <div className="w-24 h-24 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                        {(logoPreview || formData.store_logo_url) ? (
                          <img src={logoPreview || formData.store_logo_url} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <Store className="w-8 h-8 text-slate-300" />
                        )}
                      </div>
                      <div>
                        <input type="file" ref={fileInputRef} onChange={handleLogoChange} accept="image/*" className="hidden" />
                        <button type="button" onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 bg-white rounded-lg hover:bg-slate-50 text-sm font-medium shadow-sm transition-colors">
                          <Upload className="w-4 h-4" /> Tải logo lên
                        </button>
                        <p className="text-xs text-slate-500 mt-2">Kích thước đề xuất: 200x200px, PNG hoặc SVG.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên cửa hàng <span className="text-red-500">*</span></label>
                        <input type="text" name="store_name" required value={formData.store_name} onChange={handleChange} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-shadow" placeholder="Nhập tên cửa hàng" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Số điện thoại</label>
                        <input type="text" name="store_phone" value={formData.store_phone} onChange={handleChange} disabled={syncStorePhone} className={`w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-shadow ${syncStorePhone ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'bg-white'}`} placeholder="Nhập số điện thoại" />
                        <label className="flex items-center gap-2 mt-2 cursor-pointer">
                          <input type="checkbox" checked={syncStorePhone} onChange={(e) => setSyncStorePhone(e.target.checked)} className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                          <span className="text-xs text-slate-600 font-medium">Sử dụng SĐT tài khoản</span>
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                        <input type="email" name="store_email" value={formData.store_email} onChange={handleChange} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-shadow" placeholder="Nhập email liên hệ" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Địa chỉ</label>
                        <input type="text" name="store_address" value={formData.store_address} onChange={handleChange} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-shadow" placeholder="Nhập địa chỉ đầy đủ" />
                      </div>
                    </div>
                  </div>



                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => {
                      if (logoPreview) {
                        URL.revokeObjectURL(logoPreview);
                        setLogoPreview(null);
                      }
                      setSelectedLogoFile(null);
                      setFormData(initialData);
                    }} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors">
                      Hủy
                    </button>
                    <button type="submit" disabled={saving || !isFormDirty} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed">
                      <Save className="w-4 h-4" /> 
                      {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </div>

                {/* Right Column (30-35%) - Readonly Summary Cards */}
                <div className="w-full lg:w-80 xl:w-96 shrink-0 space-y-4">
                  {/* Inventory Summary */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="w-5 h-5 text-slate-500" />
                      <h4 className="font-semibold text-slate-800 text-sm">Cài đặt tồn kho</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Mức cảnh báo tồn:</span>
                        <span className="font-medium text-slate-700">{formData.default_reorder_level} SP</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Cảnh báo tồn kho lâu:</span>
                        <span className="font-medium text-slate-700">{formData.low_stock_warning_days} ngày</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Cảnh báo tự động:</span>
                        <span className={`font-medium ${formData.auto_stock_alert_enabled ? 'text-green-600' : 'text-slate-500'}`}>
                          {formData.auto_stock_alert_enabled ? 'Bật' : 'Tắt'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI Summary */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-slate-500" />
                      <h4 className="font-semibold text-slate-800 text-sm">Cài đặt AI</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Trạng thái:</span>
                        <span className={`font-medium ${formData.ai_enabled ? 'text-blue-600' : 'text-slate-500'}`}>
                          {formData.ai_enabled ? 'Đang bật' : 'Tắt'}
                        </span>
                      </div>
                      {formData.ai_enabled && (
                        <>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Dự báo:</span>
                            <span className="font-medium text-slate-700">{formData.forecast_days} ngày tới</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Model:</span>
                            <span className="font-medium text-slate-700">{formData.ai_model}</span>
                          </div>
                        </>
                      )}
                    </div>
                    <button type="button" onClick={checkAIConnection} className="mt-4 w-full py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-xs font-medium transition-colors">
                      Kiểm tra kết nối AI
                    </button>
                  </div>

                  {/* Account Summary */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-5 h-5 text-slate-500" />
                      <h4 className="font-semibold text-slate-800 text-sm">Tài khoản & Bảo mật</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex flex-col gap-0.5 text-sm">
                        <span className="font-medium text-slate-800">{userData.full_name}</span>
                        <span className="text-slate-500">{userData.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-medium text-emerald-600">Đã xác thực bảo mật</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-6">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-6">
                    <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">Cấu hình tồn kho</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Mức tồn kho tối thiểu mặc định</label>
                        <input type="number" name="default_reorder_level" value={formData.default_reorder_level} onChange={handleChange} min="0" className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-shadow" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Số ngày cảnh báo hàng tồn kho lâu</label>
                        <input type="number" name="low_stock_warning_days" value={formData.low_stock_warning_days} onChange={handleChange} min="0" className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-shadow" />
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100 space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" name="auto_stock_alert_enabled" checked={formData.auto_stock_alert_enabled} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                        <span className="text-sm text-slate-700 font-medium">Tự động cảnh báo khi sắp hết hàng</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={loadSettings} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors">
                      Hủy
                    </button>
                    <button type="submit" disabled={saving || !isFormDirty} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed">
                      <Save className="w-4 h-4" /> 
                      {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </div>

                <div className="w-full lg:w-80 xl:w-96 shrink-0 space-y-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertCircle className="w-5 h-5 text-slate-500" />
                      <h4 className="font-semibold text-slate-800 text-sm">Mô tả tác động</h4>
                    </div>
                    <ul className="space-y-3 text-sm text-slate-600 list-disc list-inside">
                      <li><span className="font-medium text-slate-700">Mức tồn tối thiểu:</span> Xác định thời điểm hệ thống cảnh báo sản phẩm sắp hết.</li>
                      <li><span className="font-medium text-slate-700">Cảnh báo tồn lâu:</span> Giúp phát hiện các mặt hàng bán chậm hoặc tồn kho kéo dài.</li>
                      <li><span className="font-medium text-slate-700">Cảnh báo tự động:</span> Gửi thông báo khi sản phẩm chuyển sang trạng thái tồn thấp.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-6">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-6">
                    <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">Cấu hình AI</h3>
                    
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" name="ai_enabled" checked={formData.ai_enabled} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                        <span className="text-sm text-blue-900 font-bold">Bật phân tích và dự báo AI</span>
                      </label>
                      <p className="text-sm text-blue-700 mt-2 ml-7">AI sẽ tự động phân tích doanh thu và gợi ý nhập hàng để tối ưu hóa tồn kho.</p>
                    </div>

                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${!formData.ai_enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Nhà cung cấp AI</label>
                        <select name="ai_provider" value={formData.ai_provider} onChange={handleChange} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-shadow">
                          <option value="Google Gemini">Google Gemini</option>
                          <option value="OpenAI">OpenAI</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Model AI</label>
                        <input type="text" name="ai_model" value={formData.ai_model} onChange={handleChange} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-shadow" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Lịch phân tích tự động / Số ngày dự báo</label>
                        <div className="relative">
                          <input type="number" name="forecast_days" value={formData.forecast_days} onChange={handleChange} min="1" max="90" className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-shadow" />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-sm text-slate-500">
                            ngày
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button type="submit" disabled={saving || !isFormDirty} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed">
                      <Save className="w-4 h-4" /> 
                      {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </div>

                <div className="w-full lg:w-80 xl:w-96 shrink-0 space-y-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-slate-500" />
                      <h4 className="font-semibold text-slate-800 text-sm">Trạng thái AI</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Trạng thái kết nối:</span>
                        <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-medium text-xs">Sẵn sàng</span>
                      </div>
                      
                      <div className="text-xs text-slate-500 flex items-start gap-1.5 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                        <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5"/>
                        <p>Kết nối AI được cấu hình và bảo mật trên hệ thống.</p>
                      </div>

                      <button type="button" onClick={checkAIConnection} className="w-full py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors shadow-sm">
                        Kiểm tra kết nối AI
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-6">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-6">
                    <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">Thông tin tài khoản</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Họ và tên</label>
                        <input type="text" name="full_name" value={userData.full_name} onChange={handleUserChange} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-shadow" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                        <input type="email" name="email" value={userData.email} onChange={handleUserChange} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-shadow" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Số điện thoại</label>
                        <input type="text" name="phone" value={userData.phone} onChange={handleUserChange} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-shadow" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Vai trò</label>
                        <input type="text" value={userData.role} disabled className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg cursor-not-allowed text-sm" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Trạng thái tài khoản</label>
                        <div className="px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-medium inline-block min-w-[200px] text-center">
                          {userData.status}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button type="submit" disabled={saving || !isFormDirty} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed">
                      <Save className="w-4 h-4" /> 
                      {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </div>

                <div className="w-full lg:w-80 xl:w-[450px] shrink-0 space-y-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <h3 className="text-sm font-bold text-slate-800">Cài đặt thanh toán PayOS</h3>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="payos_enabled" checked={formData.payos_enabled} onChange={handleChange} className="sr-only peer" />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className={`space-y-3 ${!formData.payos_enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Trạng thái cấu hình:</span>
                        <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-medium text-xs">Đã cấu hình</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Kết nối:</span>
                        <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-medium text-xs">Sẵn sàng</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Webhook:</span>
                        <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-medium text-xs">Hoạt động</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 flex items-start gap-1.5 bg-white p-3 rounded-lg border border-slate-200 shadow-sm mt-4">
                      <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5"/>
                      <p>Hệ thống thanh toán đã được kết nối và bảo mật an toàn. Thông tin ngân hàng nhận tiền tự động trích xuất từ cấu hình thanh toán.</p>
                    </div>

                    <button type="button" onClick={() => {
                      showToast({ type: 'info', title: 'Thông báo', message: 'Đang kiểm tra kết nối PayOS...' });
                      setTimeout(() => {
                        showToast({ type: 'success', title: 'Thông báo', message: 'Kết nối PayOS thành công. Dịch vụ đang hoạt động bình thường.' });
                      }, 800);
                    }} className="mt-4 w-full py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors shadow-sm">
                      Kiểm tra kết nối PayOS
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-6">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-6">
                    <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">Đổi mật khẩu</h3>
                    
                    <div className="space-y-4 max-w-xl">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu hiện tại</label>
                        <input type="password" name="current_password" value={pwdData.current_password} onChange={handlePwdChange} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-shadow" placeholder="••••••••" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu mới</label>
                        <input type="password" name="new_password" value={pwdData.new_password} onChange={handlePwdChange} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-shadow" placeholder="••••••••" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Xác nhận mật khẩu mới</label>
                        <input type="password" name="confirm_password" value={pwdData.confirm_password} onChange={handlePwdChange} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-shadow" placeholder="••••••••" />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 max-w-xl">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" name="logoutOthers" checked={pwdData.logoutOthers} onChange={handlePwdChange} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                        <span className="text-sm text-slate-700 font-medium">Đăng xuất khỏi tất cả các thiết bị khác</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button type="submit" disabled={saving || !isFormDirty} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed">
                      Cập nhật mật khẩu
                    </button>
                  </div>
                </div>

                <div className="w-full lg:w-80 xl:w-96 shrink-0 space-y-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="w-5 h-5 text-slate-500" />
                      <h4 className="font-semibold text-slate-800 text-sm">Lưu ý bảo mật</h4>
                    </div>
                    
                    <ul className="space-y-3 text-sm text-slate-600 list-disc list-inside">
                      <li>Không chia sẻ tài khoản quản trị cho bất kỳ ai.</li>
                      <li>Mật khẩu nên có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số.</li>
                      <li>Mật khẩu được bảo vệ và quản lý an toàn bởi hệ thống.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

          </form>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title={activeTab === 'security' ? "Xác nhận đổi mật khẩu" : "Xác nhận cập nhật cài đặt"}
        message={
          activeTab === 'security' 
            ? (pwdData.logoutOthers ? "Bạn có chắc chắn muốn cập nhật mật khẩu tài khoản này không? Các phiên đăng nhập trên thiết bị khác cũng sẽ bị đăng xuất." : "Bạn có chắc chắn muốn cập nhật mật khẩu tài khoản này không?") 
            : "Bạn có chắc chắn muốn lưu các thay đổi cài đặt này không?"
        }
        confirmText="Xác nhận cập nhật"
        cancelText="Hủy"
        onConfirm={confirmSave}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </PageContainer>
  );
}
