const SettingService = require('../services/SettingService');
const { z } = require('zod');

// Schema validation (cho phép update từng phần hoặc toàn bộ)
const settingsSchema = z.object({
  store_name: z.string().optional(),
  store_phone: z.string().optional().nullable(),
  store_email: z.string().email().optional().nullable(),
  store_address: z.string().optional().nullable(),
  store_logo_url: z.string().optional().nullable(),
  low_stock_warning_days: z.number().int().min(0).optional(),
  default_reorder_level: z.number().int().min(0).optional(),
  auto_stock_alert_enabled: z.boolean().optional(),
  allow_negative_stock: z.boolean().optional(),
  ai_enabled: z.boolean().optional(),
  ai_provider: z.string().optional(),
  ai_model: z.string().optional(),
  forecast_days: z.number().int().min(1).optional(),
  payos_enabled: z.boolean().optional(),
  bank_name: z.string().optional().nullable(),
  bank_account_no: z.string().optional().nullable(),
  bank_account_name: z.string().optional().nullable(),
  currency: z.string().optional(),
  date_format: z.string().optional(),
  maintenance_mode: z.boolean().optional(),
}).partial();

class SettingController {
  async getSettings(req, res, next) {
    try {
      const settings = await SettingService.getSettings();
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req, res, next) {
    try {
      const validatedData = settingsSchema.parse(req.body);
      const settings = await SettingService.updateSettings(validatedData);
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }

  async uploadLogo(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn ảnh logo' });
      }

      const file = req.file;
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return res.status(400).json({ success: false, message: 'Chỉ hỗ trợ ảnh PNG, JPG hoặc WEBP' });
      }

      const data = await SettingService.uploadStoreLogo(file);

      res.json({
        success: true,
        message: 'Upload logo thành công',
        data
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SettingController();
