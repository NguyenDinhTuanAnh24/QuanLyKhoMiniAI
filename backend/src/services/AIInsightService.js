const AIRepository = require('../repositories/AIRepository');
const ForecastService = require('./ForecastService');
const GeminiAIService = require('./GeminiAIService');
const crypto = require('crypto');

class AIInsightService {
  async runAnalysis(settings) {
    const aiEnabled = settings?.ai_enabled ?? false;
    const forecastDays = settings?.ai_forecast_days ?? 14;
    const aiModel = process.env.GEMINI_MODEL || settings?.ai_model || 'gemini-2.5-flash';

    // 1. Lấy dữ liệu cơ sở
    const rawData = await AIRepository.getForecastBaseData();

    // 2. Tính toán Rule-based Baseline
    const baselineData = ForecastService.calculateBaseline(rawData, forecastDays);

    let runProvider = 'Rule-based';
    const ruleBasedReport = ForecastService.buildDetailedReport(baselineData, forecastDays, 90);
    let finalReport = { ...ruleBasedReport };
    
    let recommendations = baselineData.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        sku: item.sku,
        category_name: item.category_name,
        supplier_name: item.supplier_name,
        unit_name: item.unit_name,
        stock_quantity: item.stock_quantity,
        reorder_level: item.reorder_level,
        sales_90d: item.sales_90d,
        avg_daily_sales_90d: item.avg_daily_sales_90d,
        forecast_14d: item.forecast_14d,
        suggested_import_quantity: item.suggested_import_quantity,
        priority: item.priority,
        reason: item.reason,
        status: 'PENDING'
    }));
    
    let extraInsight = null;

    // 3. Nếu bật AI, gọi LLM API
    if (aiEnabled && process.env.GEMINI_API_KEY) {
      try {
        const aiInsight = await GeminiAIService.analyzeInventory(baselineData, aiModel, forecastDays);
        extraInsight = aiInsight;
        runProvider = 'Google Gemini';

        // Merge AI report with rule-based report
        finalReport.overview_comment = aiInsight.overview_comment || finalReport.overview_comment;
        finalReport.inventory_comment = aiInsight.inventory_comment || finalReport.inventory_comment;
        finalReport.sales_comment = aiInsight.sales_comment || finalReport.sales_comment;
        finalReport.urgent_import_products = aiInsight.urgent_import_products || finalReport.urgent_import_products;
        finalReport.top_selling_products = aiInsight.top_selling_products || finalReport.top_selling_products;
        finalReport.slow_moving_products = aiInsight.slow_moving_products || finalReport.slow_moving_products;
        finalReport.category_insights = aiInsight.category_insights || finalReport.category_insights;
        finalReport.supplier_insights = aiInsight.supplier_insights || finalReport.supplier_insights;
        finalReport.recommended_actions = aiInsight.recommended_actions || finalReport.recommended_actions;

        // Ghi đè số lượng và lý do từ AI nếu có
        if (aiInsight.urgent_import_products && Array.isArray(aiInsight.urgent_import_products)) {
          const aiRecMap = new Map();
          aiInsight.urgent_import_products.forEach(r => aiRecMap.set(r.product_id, r));

          recommendations = recommendations.map(rec => {
            const aiOverride = aiRecMap.get(rec.product_id);
            if (aiOverride) {
              return {
                ...rec,
                suggested_import_quantity: aiOverride.suggested_quantity !== undefined ? Math.max(0, aiOverride.suggested_quantity) : rec.suggested_import_quantity,
                priority: aiOverride.priority || rec.priority,
                reason: aiOverride.reason || rec.reason
              };
            }
            return rec;
          });
        }
      } catch (error) {
        console.error('AI Analysis Failed, falling back to rule-based:', error.message);
        finalReport.overview_comment = `Dự báo nội bộ (AI tạm thời không khả dụng: ${error.message}). ` + finalReport.overview_comment;
      }
    } else if (aiEnabled && !process.env.GEMINI_API_KEY) {
      finalReport.overview_comment = 'Dự báo nội bộ (Chưa cấu hình API Key cho AI). ' + finalReport.overview_comment;
    }

    const finalSummary = JSON.stringify(finalReport);

    // 4. Lưu vào Database
    const runId = crypto.randomUUID();
    
    // Gắn run_id và tạo uuid cho từng recommendation
    const dbRecommendations = recommendations.map(rec => ({
      ...rec,
      recommendation_id: crypto.randomUUID(),
      run_id: runId
    }));

    const runData = {
      run_id: runId,
      run_type: 'INVENTORY_FORECAST',
      provider: runProvider,
      model: aiModel,
      status: 'COMPLETED',
      summary: finalSummary,
      total_products: baselineData.length,
      total_recommendations: recommendations.length,
    };

    await AIRepository.saveAnalysisRun(runData, dbRecommendations);

    return {
      run: runData,
      recommendations: dbRecommendations,
      insight: extraInsight
    };
  }

  async getLatestRecommendations() {
    return await AIRepository.getLatestRecommendations();
  }

  async getForecastBase() {
    const rawData = await AIRepository.getForecastBaseData();
    const baselineData = ForecastService.calculateBaseline(rawData, 14);
    const detailedReport = ForecastService.buildDetailedReport(baselineData, 14, 90);
    return {
      items: baselineData,
      run: {
        provider: 'Rule-based',
        summary: JSON.stringify(detailedReport)
      }
    };
  }

  async updateRecommendationStatus(id, status) {
    return await AIRepository.updateRecommendationStatus(id, status);
  }
}

module.exports = new AIInsightService();
