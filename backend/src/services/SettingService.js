const SettingRepository = require('../repositories/SettingRepository');
const { BusinessException } = require('../middleware/errorHandler');

class SettingService {
  async getSettings() {
    const settings = await SettingRepository.getSettings();
    if (!settings) {
      // Tùy chọn: Nếu chưa có DEFAULT thì tự insert (nhưng mình đã có SEED).
      throw new BusinessException('SETTINGS_NOT_FOUND', 'Cấu hình hệ thống chưa được khởi tạo');
    }
    return settings;
  }

  async updateSettings(settingsData) {
    // Kiểm tra xem đã có dòng DEFAULT chưa
    const existing = await SettingRepository.getSettings();
    if (!existing) {
      throw new BusinessException('SETTINGS_NOT_FOUND', 'Cấu hình hệ thống chưa được khởi tạo');
    }
    
    return await SettingRepository.updateSettings(settingsData);
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
