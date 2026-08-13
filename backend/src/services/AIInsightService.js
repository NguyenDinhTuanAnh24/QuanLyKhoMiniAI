const AIRepository = require('../repositories/AIRepository');
const ForecastService = require('./ForecastService');
const GeminiAIService = require('./GeminiAIService');
const crypto = require('crypto');
const notificationService = require('./NotificationService');
const { randomUUID } = require('node:crypto');

const activeRuns = new Map();

class AIInsightService {
  async runAnalysis(settings) {
    const runId = randomUUID();
    
    const initialRun = {
      run_id: runId,
      status: 'PROCESSING',
      phase: 'INITIALIZING',
      progress: 0,
      progress_message: 'Đang khởi tạo phiên phân tích...',
      started_at: new Date().toISOString()
    };
    
    // Khởi tạo trạng thái run
    activeRuns.set(runId, initialRun);

    try {
      await AIRepository.createAnalysisRun(initialRun);
    } catch (e) {
      console.error('Error creating run in DB', e);
    }

    // Start background job without awaiting
    this.startAnalysisJob(runId, settings).catch(err => console.error('Background AI Job Error:', err));

    return {
      run_id: runId,
      status: 'PROCESSING'
    };
  }

  async getAnalysisProgress(runId) {
    if (activeRuns.has(runId)) {
      return activeRuns.get(runId);
    }
    // Nếu không có trong memory, có thể check database (nếu đã migrate).
    try {
      const { data, error } = await AIRepository.getLatestRecommendations(); // Hoặc lấy cụ thể bằng runId
      if (data && data.run && data.run.run_id === runId) return data.run;
    } catch(e) {}
    
    return {
      run_id: runId,
      status: 'NOT_FOUND',
      message: 'Không tìm thấy tiến trình hoặc tiến trình đã kết thúc từ lâu.'
    };
  }

  async startAnalysisJob(runId, settings) {
    const updateProgress = async (phase, progress, message, extra = {}) => {
      const updated = {
        ...activeRuns.get(runId),
        phase,
        progress,
        progress_message: message,
        ...extra
      };
      activeRuns.set(runId, updated);
      try {
        await AIRepository.updateAnalysisProgress(runId, { phase, progress, progress_message: message });
      } catch (e) {
        console.error('Error updating progress in DB', e);
      }
    };

    try {
      await updateProgress('LOADING_SETTINGS', 10, 'Đang đọc cấu hình phân tích...');
      const aiEnabled = settings?.ai_enabled ?? false;
      const forecastDays = settings?.ai_forecast_days ?? 14;
      const aiModel = process.env.GEMINI_MODEL || settings?.ai_model || 'gemini-2.5-flash';

      await updateProgress('LOADING_PRODUCTS', 20, 'Đang tải dữ liệu sản phẩm...');
      // Note: Data is actually fetched in one query, so we combine SALES and PRODUCTS conceptually.
      await updateProgress('LOADING_SALES', 30, 'Đang tổng hợp lịch sử bán hàng...');
      const rawData = await AIRepository.getForecastBaseData();

      await updateProgress('ANALYZING_INVENTORY', 40, 'Đang phân tích tình trạng tồn kho...');
      // Logic inside calculateBaseline handles inventory
      await updateProgress('FORECASTING', 50, 'Đang tính nhu cầu dự báo...');
      const baselineData = ForecastService.calculateBaseline(rawData, forecastDays);

      await updateProgress('AGGREGATING', 60, 'Đang tổng hợp danh mục và nhà cung cấp...');
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
          await updateProgress('PREPARING_AI', 70, 'Đang chuẩn bị dữ liệu cho AI...');
          // Delay simulating preparation logic if it's too fast, but we don't fake delay. Just moving to next state.
          await updateProgress('AI_ANALYZING', 80, 'AI đang phân tích xu hướng và rủi ro...');
          
          const aiInsight = await GeminiAIService.analyzeInventory(baselineData, aiModel, forecastDays, ruleBasedReport.supplier_insights);
          extraInsight = aiInsight;
        runProvider = 'Google Gemini';

        // Merge AI report with rule-based report
        finalReport.executive_summary = aiInsight.executive_summary || this.generateRuleBasedExecutiveSummary(baselineData);
        finalReport.urgent_products = aiInsight.urgent_products || [];
        finalReport.top_selling_products = aiInsight.top_selling_products || [];
        finalReport.slow_moving_products = aiInsight.slow_moving_products || [];
        finalReport.category_insights = aiInsight.category_insights || [];
        
        // Merge supplier insights by supplier_id
        if (aiInsight.supplier_insights && Array.isArray(aiInsight.supplier_insights)) {
          const aiSupplierMap = new Map();
          aiInsight.supplier_insights.forEach(s => aiSupplierMap.set(String(s.supplier_id), s));
          
          finalReport.supplier_insights = finalReport.supplier_insights.map(s => {
            const aiOverride = aiSupplierMap.get(String(s.supplier_id));
            if (aiOverride) {
              return {
                ...s,
                insights: aiOverride.insights || [],
                recommendations: aiOverride.recommendations || []
              };
            }
            return s;
          });
        }
        
        finalReport.forecast_products = aiInsight.forecast_products || [];
        finalReport.recommended_actions = (aiInsight.executive_summary && aiInsight.executive_summary.recommended_actions) ? aiInsight.executive_summary.recommended_actions : (aiInsight.recommended_actions || []);
        
        analysisMode = 'gemini_enhanced';
        finalReport.analysis_mode = analysisMode;
        
        if (aiInsight.urgent_products && Array.isArray(aiInsight.urgent_products)) {
          const baselineMap = new Map(
            baselineData.map(item => [String(item.product_id), item])
          );

          const aiRecMap = new Map();
          aiInsight.urgent_products.forEach(r => aiRecMap.set(String(r.product_id), r));

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
        finalReport.analysis_mode = 'rule_based';
        finalReport.executive_summary = this.generateRuleBasedExecutiveSummary(baselineData);
      }
    } else if (aiEnabled && !process.env.GEMINI_API_KEY) {
      finalReport.analysis_mode = 'rule_based';
      finalReport.executive_summary = this.generateRuleBasedExecutiveSummary(baselineData);
    } else {
      finalReport.analysis_mode = 'rule_based';
      finalReport.executive_summary = this.generateRuleBasedExecutiveSummary(baselineData);
    }

    const finalSummary = JSON.stringify(finalReport);

    // 4. Lưu vào Database
    
      // Lọc ra các recommendation thực sự cần nhập hàng để lưu vào DB (action_type = 'REORDER_STOCK')
      recommendations = recommendations
          .filter(rec => rec.suggested_import_quantity > 0)
          .map(rec => ({
              ...rec,
              action_type: 'REORDER_STOCK',
              status: 'PENDING'
          }));
      await updateProgress('BUILDING_RECOMMENDATIONS', 90, 'Đang tổng hợp khuyến nghị...');
      await updateProgress('SAVING', 95, 'Đang lưu kết quả phân tích...');
      // 4. Lưu kết quả vào DB
      await AIRepository.saveAnalysisRun({
        run_id: runId, // Dùng chung ID
        run_type: 'DAILY',
        provider: runProvider,
        model: aiEnabled ? aiModel : 'N/A',
        status: 'COMPLETED',
        summary: finalSummary,
        total_products: baselineData.length,
        total_recommendations: finalReport.recommended_actions?.length || 0
      }, recommendations);

      finalReport.run_id = runId;
      finalReport.generated_at = new Date().toISOString();

      try {
        // Emit Notification
        await notificationService.createNotification({
          type: 'AI_ANALYSIS_COMPLETED',
          title: `Phân tích AI hoàn thành`,
          message: `Đã hoàn thành phân tích AI (${runProvider}). Tổng cộng ${baselineData.length} sản phẩm, ${recommendations.length} đề xuất.`,
          severity: 'INFO',
          relatedType: 'AI_RUN',
          relatedId: runId,
          relatedLink: '/ai-insights',
          recipientRoles: ['ADMIN', 'OWNER', 'WAREHOUSE_STAFF'],
          dedupKey: `AI_ANALYSIS_COMPLETED:RUN:${runId}`
        });

        // 2. High/Critical recommendations
        const criticalRecs = recommendations.filter(r => r.priority === 'HIGH' || r.priority === 'CRITICAL');
        if (criticalRecs.length > 0) {
          await notificationService.createNotification({
            type: 'AI_REORDER_RECOMMENDATION',
            title: `Cảnh báo AI: Nhập hàng gấp`,
            message: `AI phát hiện ${criticalRecs.length} sản phẩm cần nhập gấp.`,
            severity: 'HIGH',
            relatedType: 'AI_RUN',
            relatedId: runId,
            relatedLink: '/ai-insights',
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
            relatedLink: '/ai-insights',
            recipientRoles: ['ADMIN', 'OWNER', 'WAREHOUSE_STAFF'],
            dedupKey: `AI_SLOW_MOVING:RUN:${runId}`
          });
        }
      } catch (e) {
        console.error('Error generating AI analysis notifications', e);
      }

      await updateProgress('COMPLETED', 100, 'Phân tích hoàn tất', { status: 'COMPLETED', result: finalReport });
      return finalReport;
    } catch (error) {
      console.error('Lỗi khi phân tích:', error);
      await updateProgress('FAILED', 100, 'Lỗi phân tích: ' + error.message, { status: 'FAILED' });
      throw error;
    }
  }

  async getLatestRecommendations() {
    return await AIRepository.getLatestRecommendations();
  }

  generateRuleBasedExecutiveSummary(baselineData) {
    const totalProducts = baselineData.length;
    const needImportCount = baselineData.filter(p => p.suggested_import_quantity > 0).length;
    const topSellingCount = baselineData.filter(p => p.avg_daily_sales_90d >= 1).length;
    const slowMovingCount = baselineData.filter(p => p.avg_daily_sales_90d < 0.2 && p.stock_quantity > 0).length;
    const criticalCount = baselineData.filter(p => p.priority === 'CRITICAL').length;
    
    let status = 'STABLE';
    if (criticalCount > 0) status = 'CRITICAL';
    else if (needImportCount > 0) status = 'WARNING';

    const overview = `Trong ${totalProducts} sản phẩm đang được theo dõi, có ${needImportCount} sản phẩm có mức tồn thấp hơn ngưỡng an toàn và cần được xem xét bổ sung. Hoạt động bán hàng hiện ghi nhận ${topSellingCount} mặt hàng tiêu thụ tốt, trong khi có ${slowMovingCount} sản phẩm có tốc độ bán chậm. Rủi ro chính hiện tại là tình trạng thiếu hàng ở nhóm sản phẩm thiết yếu.`;
    
    const key_findings = [
      `${needImportCount}/${totalProducts} sản phẩm đang dưới mức tồn an toàn.`,
      `Có ${topSellingCount} sản phẩm có tốc độ bán nổi bật.`,
      `Phần lớn các mặt hàng (${slowMovingCount} sản phẩm) có tốc độ tiêu thụ thấp.`
    ];

    const risks = [];
    if (criticalCount > 0) {
      risks.push(`Nguy cơ thiếu hàng ở ${criticalCount} sản phẩm thiết yếu nếu không bổ sung kịp thời.`);
    }
    if (slowMovingCount > 0) {
      risks.push(`Tồn kho cao ở nhóm sản phẩm bán chậm có thể làm tăng chi phí lưu kho.`);
    }

    const opportunities = [];
    if (topSellingCount > 0) {
      opportunities.push(`Ưu tiên ngân sách cho các sản phẩm có tốc độ quay vòng tốt.`);
    }
    if (slowMovingCount > 0) {
      opportunities.push(`Cân nhắc chương trình khuyến mại hoặc giảm nhập cho nhóm tồn lâu.`);
    }

    const recommended_actions = [];
    if (needImportCount > 0) {
      recommended_actions.push({
        priority: 'HIGH',
        title: 'Bổ sung tồn kho khẩn cấp',
        description: `Tạo phiếu nhập cho ${needImportCount} sản phẩm đang cạn kiệt.`
      });
    }

    return { status, overview, key_findings, risks, opportunities, recommended_actions };
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

  async applyRecommendation(id, userId) {
    return await AIRepository.applyRecommendation(id, userId);
  }

  async applyBulkRecommendations(analysis_run_id, userId) {
    return await AIRepository.applyBulkRecommendations(analysis_run_id, userId);
  }
}

module.exports = new AIInsightService();
