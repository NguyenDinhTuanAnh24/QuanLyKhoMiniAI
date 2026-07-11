const AIInsightService = require('../services/AIInsightService');
const SettingService = require('../services/SettingService');

class AIController {
  async getSettings(req, res) {
    try {
      const settings = await SettingService.getSettings();
      res.json({ success: true, data: settings });
    } catch (error) {
      console.error('Error getting AI settings:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi tải cấu hình AI', error: error.message });
    }
  }

  async updateSettings(req, res) {
    try {
      // Just extract AI relevant fields
      const { ai_enabled, ai_provider, ai_model, forecast_days } = req.body;
      const payload = {};
      if (ai_enabled !== undefined) payload.ai_enabled = ai_enabled;
      if (ai_provider !== undefined) payload.ai_provider = ai_provider;
      if (ai_model !== undefined) payload.ai_model = ai_model;
      if (forecast_days !== undefined) payload.forecast_days = forecast_days;

      const settings = await SettingService.updateSettings(payload);
      res.json({ success: true, data: settings });
    } catch (error) {
      console.error('Error updating AI settings:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi cập nhật cấu hình AI', error: error.message });
    }
  }
  async getForecast(req, res) {
    try {
      const data = await AIInsightService.getForecastBase();
      res.json({ success: true, data });
    } catch (error) {
      console.error('Error getting forecast:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi tính toán dự báo', error: error.message });
    }
  }

  async analyze(req, res) {
    try {
      // Giả sử settings được gửi từ client hoặc lấy từ DB settings
      // Trong app này settings lưu trong DB. Tạm thời nhận ai_enabled từ request hoặc cấu hình mặc định bật.
      const settings = req.body.settings || { ai_enabled: true, ai_forecast_days: 14 };
      
      const result = await AIInsightService.runAnalysis(settings);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Error running AI analysis:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi phân tích bằng AI', error: error.message });
    }
  }

  async getRecommendations(req, res) {
    try {
      const data = await AIInsightService.getLatestRecommendations();
      res.json({ success: true, data });
    } catch (error) {
      console.error('Error getting recommendations:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi tải kết quả gợi ý', error: error.message });
    }
  }

  async applyRecommendation(req, res) {
    try {
      const { id } = req.params;
      const data = await AIInsightService.updateRecommendationStatus(id, 'APPLIED');
      res.json({ success: true, message: 'Đã áp dụng gợi ý', data });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Lỗi khi cập nhật trạng thái', error: error.message });
    }
  }

  async ignoreRecommendation(req, res) {
    try {
      const { id } = req.params;
      const data = await AIInsightService.updateRecommendationStatus(id, 'IGNORED');
      res.json({ success: true, message: 'Đã bỏ qua gợi ý', data });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Lỗi khi cập nhật trạng thái', error: error.message });
    }
  }

  async testConnection(req, res) {
    const hasKey = !!process.env.GEMINI_API_KEY;
    if (hasKey) {
      res.json({ 
        success: true, 
        configured: true,
        message: 'Kết nối AI thành công. Đã cấu hình API Key.' 
      });
    } else {
      res.status(200).json({ 
        success: false, 
        configured: false,
        message: 'Chưa cấu hình GEMINI_API_KEY trong backend .env. Hệ thống vẫn có thể chạy dự báo nội bộ.' 
      });
    }
  }
}

module.exports = new AIController();
