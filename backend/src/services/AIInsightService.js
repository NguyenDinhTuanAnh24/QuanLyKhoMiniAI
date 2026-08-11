const AIRepository = require('../repositories/AIRepository');
const ForecastService = require('./ForecastService');
const GeminiAIService = require('./GeminiAIService');
const crypto = require('crypto');
const notificationService = require('./NotificationService');

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
    let analysisMode = 'rule_based';
    const ruleBasedReport = ForecastService.buildDetailedReport(baselineData, forecastDays, 90);
    let finalReport = { ...ruleBasedReport, analysis_mode: analysisMode };
    
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
        forecast_14d: item.forecast_quantity,
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
        finalReport.top_selling_products = aiInsight.top_selling_products || finalReport.top_selling_products;
        finalReport.slow_moving_products = aiInsight.slow_moving_products || finalReport.slow_moving_products;
        finalReport.category_insights = aiInsight.category_insights || finalReport.category_insights;
        finalReport.supplier_insights = aiInsight.supplier_insights || finalReport.supplier_insights;
        finalReport.recommended_actions = aiInsight.recommended_actions || finalReport.recommended_actions;
        analysisMode = 'gemini_enhanced';
        finalReport.analysis_mode = analysisMode;
        
        if (aiInsight.urgent_import_products && Array.isArray(aiInsight.urgent_import_products)) {
          const baselineMap = new Map(
            baselineData.map(item => [String(item.product_id), item])
          );

          const aiRecMap = new Map();
          aiInsight.urgent_import_products.forEach(r => aiRecMap.set(String(r.product_id), r));

          finalReport.urgent_import_products = finalReport.urgent_import_products.map(baseline => {
            const aiOverride = aiRecMap.get(String(baseline.product_id));
            if (aiOverride && aiOverride.reason) {
              return {
                ...baseline,
                reason: aiOverride.reason
              };
            }
            return baseline;
          });

          recommendations = recommendations.map(rec => {
            const aiOverride = aiRecMap.get(String(rec.product_id));
            if (aiOverride && aiOverride.reason) {
              return {
                ...rec,
                reason: aiOverride.reason
              };
            }
            return rec;
          });
        }
      } catch (error) {
        console.error('AI Analysis Failed, falling back to rule-based:', error.message);
        finalReport.overview_comment = `Dự báo nội bộ (AI tạm thời không khả dụng: ${error.message}). ` + finalReport.overview_comment;
        finalReport.analysis_mode = 'rule_based';
      }
    } else if (aiEnabled && !process.env.GEMINI_API_KEY) {
      finalReport.overview_comment = 'Dự báo nội bộ (Chưa cấu hình API Key cho AI). ' + finalReport.overview_comment;
      finalReport.analysis_mode = 'rule_based';
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

    // Notifications
    try {
      // 1. Analysis Completed
      await notificationService.createNotification({
        type: 'AI_ANALYSIS_COMPLETED',
        title: `Phân tích AI hoàn thành`,
        message: `Đã hoàn thành phân tích AI (${runProvider}). Tổng cộng ${baselineData.length} sản phẩm, ${recommendations.length} đề xuất.`,
        severity: 'INFO',
        relatedType: 'AI_RUN',
        relatedId: runId,
        recipientRoles: ['ADMIN', 'OWNER', 'WAREHOUSE_STAFF'],
        dedupKey: `AI_ANALYSIS_COMPLETED:RUN:${runId}`
      });

      // 2. High/Critical recommendations
      const criticalRecs = dbRecommendations.filter(r => r.priority === 'HIGH' || r.priority === 'CRITICAL');
      if (criticalRecs.length > 0) {
        await notificationService.createNotification({
          type: 'AI_REORDER_RECOMMENDATION',
          title: `Cảnh báo AI: Nhập hàng gấp`,
          message: `AI phát hiện ${criticalRecs.length} sản phẩm cần nhập gấp.`,
          severity: 'HIGH',
          relatedType: 'AI_RUN',
          relatedId: runId,
          recipientRoles: ['ADMIN', 'OWNER', 'WAREHOUSE_STAFF'],
          dedupKey: `AI_REORDER_RECOMMENDATION:RUN:${runId}`
        });
      }

      // 3. Slow-moving products
      if (finalReport.slow_moving_products && finalReport.slow_moving_products.length > 0) {
        await notificationService.createNotification({
          type: 'AI_SLOW_MOVING',
          title: `Cảnh báo AI: Hàng tồn đọng chậm luân chuyển`,
          message: `AI phát hiện ${finalReport.slow_moving_products.length} sản phẩm có dấu hiệu ế/chậm luân chuyển.`,
          severity: 'WARNING',
          relatedType: 'AI_RUN',
          relatedId: runId,
          recipientRoles: ['ADMIN', 'OWNER', 'WAREHOUSE_STAFF'],
          dedupKey: `AI_SLOW_MOVING:RUN:${runId}`
        });
      }
    } catch (notiErr) {
      console.error('[AIInsightService] Failed to create notifications, but analysis succeeded:', notiErr);
    }

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
