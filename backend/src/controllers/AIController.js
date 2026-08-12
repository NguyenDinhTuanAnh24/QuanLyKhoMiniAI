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
      const settings = req.body.settings || { ai_enabled: true, ai_forecast_days: 14 };
      
      const result = await AIInsightService.runAnalysis(settings);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Error starting AI analysis:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi khởi chạy phân tích AI', error: error.message });
    }
  }

  async getAnalysisProgress(req, res) {
    try {
      const { runId } = req.params;
      const progress = await AIInsightService.getAnalysisProgress(runId);
      res.json({ success: true, data: progress });
    } catch (error) {
      console.error('Error getting AI analysis progress:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy trạng thái phân tích', error: error.message });
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
      const userId = req.user ? req.user.id : 'SYSTEM';
      const planId = await AIInsightService.applyRecommendation(id, userId);
      res.json({ 
        success: true, 
        message: 'Đã tạo phiếu nhập nháp từ gợi ý AI', 
        data: {
          recommendation_id: id,
          status: 'APPLIED',
          application: {
            type: 'IMPORT_PLAN',
            id: planId
          }
        } 
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async applyBulkRecommendations(req, res) {
    try {
      const { analysis_run_id } = req.body;
      if (!analysis_run_id) throw new Error('Thiếu mã phiên phân tích (analysis_run_id) hợp lệ');
      
      const userId = req.user ? req.user.id : 'SYSTEM';
      const result = await AIInsightService.applyBulkRecommendations(analysis_run_id, userId);
      
      res.json({
        success: true,
        message: `Đã tạo kế hoạch nhập hàng cho ${result.count} sản phẩm.`,
        data: {
          application: {
            type: 'IMPORT_PLAN',
            id: result.planId
          },
          count: result.count
        }
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
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
