const SettingRepository = require('../repositories/SettingRepository');
const { BusinessException } = require('../middleware/errorHandler');
const notificationService = require('./NotificationService');

class SettingService {
  async getSettings() {
    const settings = await SettingRepository.getSettings();
    if (!settings) {
      // Tùy chọn: Nếu chưa có DEFAULT thì tự insert (nhưng mình đã có SEED).
      throw new BusinessException('SETTINGS_NOT_FOUND', 'Cấu hình hệ thống chưa được khởi tạo');
    }
    return settings;
  }

  async getBranding() {
    const settings = await SettingRepository.getSettings();
    if (!settings) {
      return { store_name: 'Cửa hàng của tôi', store_logo_url: null };
    }
    return {
      store_name: settings.store_name,
      store_logo_url: settings.store_logo_url
    };
  }

  async updateSettings(settingsData) {
    // Kiểm tra xem đã có dòng DEFAULT chưa
    const existing = await SettingRepository.getSettings();
    if (!existing) {
      throw new BusinessException('SETTINGS_NOT_FOUND', 'Cấu hình hệ thống chưa được khởi tạo');
    }
    
    const updatedSettings = await SettingRepository.updateSettings(settingsData);
    
    try {
      await notificationService.createNotification({
        type: 'SETTINGS_UPDATED',
        title: `Cập nhật cấu hình`,
        message: `Cấu hình hệ thống đã được thay đổi.`,
        severity: 'INFO',
        relatedType: 'SYSTEM',
        relatedId: 'SETTINGS',
        recipientRoles: ['ADMIN', 'OWNER']
      });
    } catch (notiErr) {
      console.error('[SettingService] Notification error for SETTINGS_UPDATED:', notiErr);
    }
    
    return updatedSettings;
  }

  async uploadStoreLogo(file) {
    if (!file) {
      throw new BusinessException('BAD_REQUEST', 'Không có file ảnh');
    }

    const supabase = require('../config/supabase');
    
    const safeName = file.originalname
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9.\-]/g, '');

    const filePath = `logos/logo-${Date.now()}-${safeName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('store-assets')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload logo error:', uploadError);
      throw uploadError;
    }

    const { data: publicData } = supabase.storage
      .from('store-assets')
      .getPublicUrl(filePath);

    const imageUrl = publicData.publicUrl;

    // Cập nhật vào bảng settings
    await SettingRepository.updateSettings({ store_logo_url: imageUrl });

    return { store_logo_url: imageUrl };
  }
}

module.exports = new SettingService();
