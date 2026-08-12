import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, RefreshCw, Zap, Bot, Box, Activity, ArrowRight, Loader2, Play, BrainCircuit } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { 
  getAISettings, 
  getAIForecast, 
  getAIRecommendations, 
  runAIAnalysis, 
  getAnalysisProgress,
  applyAIRecommendation,
  applyBulkAIRecommendations,
  testAIConnection,
  normalizeForecastItem
} from '../services/aiService';
import { getCategories } from '../services/categoryService';

import AIStatCards from '../components/ai/AIStatCards';
import AIAnalysisReport from '../components/ai/AIAnalysisReport';
import AIRestockSuggestions from '../components/ai/AIRestockSuggestions';
import AIForecastChart from '../components/ai/AIForecastChart';
import AIRecommendedActions from '../components/ai/AIRecommendedActions';
import AIProductForecastTable from '../components/ai/AIProductForecastTable';
import AIAnalysisProgress from '../components/ui/AIAnalysisProgress';

import ConfirmModal from '../components/ConfirmModal';
import LoadingState from '../components/shared/LoadingState';
import EmptyState from '../components/shared/EmptyState';
import LazyRevealSection from '../components/common/LazyRevealSection';

function parseReport(reportString) {
  if (!reportString) return null;
  if (typeof reportString === 'object') return reportString;
  if (typeof reportString === 'string') {
    try {
      return JSON.parse(reportString);
    } catch (e) {
      console.error("Failed to parse report string", e);
      return { overview: reportString };
    }
  }
  return null;
}

export default function AIInsightsPage() {
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [forecasting, setForecasting] = useState(false);
  const [categories, setCategories] = useState([]);
  
  const [activeRunId, setActiveRunId] = useState(null);
  const [progressData, setProgressData] = useState({ value: 0, label: 'Đang chuẩn bị...', description: '' });

  const [settings, setSettings] = useState(null);
  const [rawData, setRawData] = useState({ run: null, items: [] });
  
  const [uiData, setUiData] = useState({
    statSummary: {},
    report: {},
    suggestions: [],
    chartData: [],
    actions: []
  });

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null, // 'analyze', 'applyAll', 'applySingle'
    product: null
  });
  const [bulkPlanId, setBulkPlanId] = useState(null);

  const fetchDependencies = async () => {
    try {
      const cats = await getCategories();
      setCategories(Array.isArray(cats?.data) ? cats.data : []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    }
  };

  const buildAIInsightsData = (items, runData) => {
    // 0. Parse the report safely
    const parsedReport = parseReport(runData?.summary);

    // 1. Calculate KPI base from items
    const total_suggested_import_products = items.filter(i => (i.suggested_import_quantity ?? 0) > 0).length;
    const risk_products = items.filter(i => i.priority === 'CRITICAL' || i.priority === 'HIGH' || i.priority === 'Cao' || i.priority === 'Trung bình').length;
    const top_selling_products_count = items.filter(i => (i.avg_daily_sales_90d ?? i.avg_daily_sales ?? 0) >= 1).length;
    const slow_selling_products_count = items.filter(i => (i.avg_daily_sales_90d ?? i.avg_daily_sales ?? 0) < 0.2 && (i.stock_quantity ?? 0) > 0).length;
    
    // 2. Chart base
    let chartData = [];
    if (parsedReport && parsedReport.forecast_daily) {
      chartData = parsedReport.forecast_daily;
    } else {
      const totalForecast = items.reduce((acc, i) => acc + (i.forecast_quantity ?? i.forecast_14d ?? 0), 0);
      const baseDaily = Math.floor(totalForecast / 14);
      chartData = Array.from({length: 7}).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i + 1);
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        return { 
          day: dayNames[d.getDay()], 
          value: totalForecast === 0 ? 0 : baseDaily 
        };
      });
    }

    // 3. Normalize Report Data
    let report = {
      runId: runData?.run_id || runData?.id || null,
      analysis_mode: 'rule_based',
      summaryStats: {
        totalNeedImport: total_suggested_import_products,
        riskCount: risk_products,
        topSellingCount: top_selling_products_count,
        slowMovingCount: slow_selling_products_count
      },
      executiveSummary: {
        status: 'GOOD',
        overview: 'Đã tạo báo cáo dự báo nội bộ.',
        key_findings: [],
        risks: [],
        opportunities: [],
        recommended_actions: []
      },
      urgentProducts: [],
      topSellingProducts: [],
      slowMovingProducts: [],
      categoryInsights: [],
      supplierInsights: [],
      recommendedActions: []
    };

    // Parsing moved to the top of the function


    if (parsedReport) {
      report.analysis_mode = parsedReport.analysis_mode || (runData?.provider === 'Rule-based' ? 'rule_based' : 'gemini_enhanced');
      
      if (parsedReport.executive_summary) {
        report.executiveSummary = parsedReport.executive_summary;
        if (typeof report.executiveSummary.overview !== 'string') {
          report.executiveSummary.overview = typeof parsedReport.overview === 'string' ? parsedReport.overview : (parsedReport.overview_comment || 'Đã phân tích.');
        }
      } else {
        report.executiveSummary.overview = typeof parsedReport.overview === 'string' ? parsedReport.overview : (parsedReport.overview_comment || 'Đã phân tích.');
      }

      // Merge urgent items
      report.urgentProducts = parsedReport.urgent_products || parsedReport.urgent_insights || parsedReport.urgent_import_products || [];
      // Merge top selling
      report.topSellingProducts = parsedReport.top_selling_products || parsedReport.top_selling_insights || [];
      // Merge slow moving
      report.slowMovingProducts = parsedReport.slow_moving_products || parsedReport.slow_moving_insights || [];
      
      report.categoryInsights = parsedReport.category_insights || [];
      report.supplierInsights = parsedReport.supplier_insights || [];
      report.recommendedActions = parsedReport.recommended_actions || [];
    } else {
      // Fallback arrays if no parsed report
      const suggestions = items
        .filter(i => i.suggested_import_quantity > 0)
        .sort((a,b) => b.suggested_import_quantity - a.suggested_import_quantity)
        .slice(0, 10);
      report.urgentProducts = suggestions;
      
      const topItems = [...items].sort((a,b) => (b.avg_daily_sales_90d ?? b.avg_daily_sales ?? 0) - (a.avg_daily_sales_90d ?? a.avg_daily_sales ?? 0)).slice(0, 5);
      report.topSellingProducts = topItems.filter(i => (i.avg_daily_sales_90d ?? i.avg_daily_sales ?? 0) > 0);
      
      report.slowMovingProducts = items.filter(i => (i.avg_daily_sales_90d ?? i.avg_daily_sales ?? 0) < 0.2 && (i.stock_quantity ?? 0) > 0).slice(0, 5);
    }

    // Default actions if none provided
    if (!report.recommendedActions || report.recommendedActions.length === 0) {
      if (total_suggested_import_products > 0) report.recommendedActions.push({ title: 'Nhập hàng', description: `Tạo phiếu nhập cho ${total_suggested_import_products} sản phẩm cần bổ sung.` });
      if (slow_selling_products_count > 0) report.recommendedActions.push({ title: 'Xả hàng', description: `Áp dụng chương trình khuyến mãi cho ${slow_selling_products_count} sản phẩm bán chậm.` });
    }

    return {
      statSummary: { 
        total_suggested_import_products, 
        risk_products, 
        top_selling_products: top_selling_products_count, 
        slow_selling_products: slow_selling_products_count 
      },
      report,
      suggestions: items.filter(i => i.suggested_import_quantity > 0),
      chartData,
      actions: report.recommendedActions
    };
  };

  const loadAIForecast = async () => {
    try {
      const [aiSettings, aiRecs] = await Promise.all([
        getAISettings().catch(() => null),
        getAIRecommendations().catch(() => null)
      ]);

      setSettings(aiSettings || {});

      if (aiRecs && aiRecs.recommendations && aiRecs.recommendations.length > 0) {
        setRawData({ run: aiRecs.run, items: aiRecs.recommendations });
        setUiData(buildAIInsightsData(aiRecs.recommendations, aiRecs.run));
        // Khôi phục bulkPlanId từ recommendations đã APPLIED
        const appliedRec = aiRecs.recommendations.find(r => r.status === 'APPLIED' && r.application_id);
        if (appliedRec) {
          setBulkPlanId(appliedRec.application_id);
        }
      } else {
        let forecastData = null;
        try {
          forecastData = await getAIForecast();
        } catch (err) {
          console.error(err);
          addToast({ type: 'error', message: 'Không thể tải dữ liệu phân tích. Đã xảy ra lỗi hệ thống.' });
          return;
        }

        if (forecastData && forecastData.items && forecastData.items.length > 0) {
          setRawData({ run: forecastData.run, items: forecastData.items });
          setUiData(buildAIInsightsData(forecastData.items, forecastData.run));
        } else if (Array.isArray(forecastData) && forecastData.length > 0) {
          setRawData({ run: null, items: forecastData });
          setUiData(buildAIInsightsData(forecastData, null));
        } else {
          setRawData({ run: null, items: [] });
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu AI:', error);
      addToast({ type: 'error', message: 'Đã xảy ra lỗi khi tải báo cáo AI. Vui lòng thử lại.' });
    }
  };

  const initData = async () => {
    setLoading(true);
    await Promise.all([fetchDependencies(), loadAIForecast()]);
    setLoading(false);
  };

  useEffect(() => {
    initData();
  }, []);

  useEffect(() => {
    let intervalId;
    const checkProgress = async () => {
      if (!activeRunId) return;
      try {
        const progressInfo = await getAnalysisProgress(activeRunId);
        if (progressInfo) {
          setProgressData(prev => ({
            ...prev,
            value: progressInfo.progress || 0,
            label: progressInfo.progress === 100 ? 'Hoàn tất' : 'Đang phân tích dữ liệu',
            description: progressInfo.progress_message || '',
            result: progressInfo.result || prev.result
          }));

          if (progressInfo.status === 'COMPLETED' || progressInfo.phase === 'COMPLETED') {
            clearInterval(intervalId);
          } else if (progressInfo.status === 'FAILED' || progressInfo.phase === 'FAILED') {
            clearInterval(intervalId);
            setActiveRunId(null);
            setAnalyzing(false);
            addToast({ type: 'error', message: 'Không thể tạo báo cáo mới. Kết quả trước đó vẫn được giữ nguyên.' });
          }
        }
      } catch (err) {
        console.error('Lỗi khi lấy tiến trình:', err);
      }
    };

    if (activeRunId) {
      intervalId = setInterval(checkProgress, 800);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeRunId]);

  const handleProgressComplete = async () => {
    await loadAIForecast();
    setActiveRunId(null);
    setAnalyzing(false);
    
    if (progressData.result?.analysis_mode === 'rule_based') {
      addToast({ type: 'info', message: 'Gemini hiện không khả dụng. Hệ thống đang sử dụng kết quả dự báo nội bộ.' });
    } else {
      addToast({ type: 'success', message: 'Báo cáo AI đã được cập nhật với dữ liệu mới nhất.' });
    }
  };

  const handleRunInternalForecast = async () => {
    // Keep function for potential debug/internal use but remove UI entry points
    setForecasting(true);
    try {
      const forecastData = await getAIForecast();
      if (forecastData && forecastData.items && forecastData.items.length > 0) {
        setRawData({ run: forecastData.run, items: forecastData.items });
        setUiData(buildAIInsightsData(forecastData.items, forecastData.run));
      } else if (Array.isArray(forecastData) && forecastData.length > 0) {
        setRawData({ run: null, items: forecastData });
        setUiData(buildAIInsightsData(forecastData, null));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setForecasting(false);
    }
  };

  const handleAnalyzeClick = () => {
    setModalState({ isOpen: true, type: 'analyze', product: null });
  };

  const handleApplyAllClick = () => {
    setModalState({ isOpen: true, type: 'applyAll', product: null });
  };

  const handleApplySingleClick = (product) => {
    setModalState({ isOpen: true, type: 'applySingle', product });
  };

  const executeAnalyze = async () => {
    setAnalyzing(true);
    setProgressData({ value: 0, label: 'Đang khởi tạo...', description: 'Đang gửi yêu cầu phân tích...' });
    
    try {
      const result = await runAIAnalysis({ 
        ai_enabled: settings?.ai_enabled ?? true, 
        ai_forecast_days: settings?.forecast_days ?? 14,
        ai_model: settings?.ai_model ?? 'gemini-1.5-pro'
      });
      
      const runId = result?.data?.data?.run_id ?? result?.data?.run_id ?? result?.run_id;
      if (runId) {
        setActiveRunId(runId);
      } else {
        throw new Error('Không nhận được run_id từ hệ thống');
      }
    } catch (e) {
      console.error(e);
      addToast({ type: 'error', message: 'Không thể khởi chạy phân tích. Vui lòng thử lại.' });
      setAnalyzing(false);
    }
  };

  const executeApplyAll = async () => {
    const analysisRunId = rawData.run?.run_id || rawData.run?.id;

    if (!analysisRunId) {
      addToast({ type: 'warning', message: 'Vui lòng "Chạy phân tích AI" để lưu kết quả trước khi tạo kế hoạch.' });
      return;
    }

    try {
      const res = await applyBulkAIRecommendations(analysisRunId);
      const planId = res?.data?.application?.id || res?.application?.id;
      
      if (planId) {
        setBulkPlanId(planId);
        addToast({ type: 'success', message: res.message || 'Đã tạo kế hoạch nhập hàng' });
        // Update locally
        setRawData(prev => ({
          ...prev,
          items: prev.items.map(item => 
            (item.suggested_import_quantity > 0 && (!item.status || item.status === 'PENDING'))

              ? { ...item, status: 'APPLIED', application_id: planId }
              : item
          )
        }));
      }
      
    } catch (error) {
      addToast({ type: 'error', message: error.message || 'Lỗi khi tạo kế hoạch nhập hàng.' });
    }
  };

  const executeApplySingle = async () => {
    if (!modalState.product) return;
    try {
      let singlePlanId = null;
      if (modalState.product.recommendation_id) {
        const res = await applyAIRecommendation(modalState.product.recommendation_id);
        singlePlanId = res?.data?.application?.id || res?.application?.id;
      }
      // Cập nhật item locally
      if (singlePlanId) {
        setRawData(prev => ({
          ...prev,
          items: prev.items.map(item => 
            item.recommendation_id === modalState.product.recommendation_id
              ? { ...item, status: 'APPLIED', application_id: singlePlanId }
              : item
          )
        }));
      }
      addToast({ type: 'success', message: 'Gợi ý AI đã được chuyển thành phiếu nhập nháp.' });
    } catch (error) {
      addToast({ type: 'error', message: error.message || 'Lỗi khi tạo phiếu nhập nháp.' });
    }
  };

  const confirmAction = () => {
    if (modalState.type === 'analyze') executeAnalyze();
    else if (modalState.type === 'applyAll') executeApplyAll();
    else if (modalState.type === 'applySingle') executeApplySingle();
    setModalState({ isOpen: false, type: null, product: null });
  };

  if (loading) return <LoadingState message="Đang tải dữ liệu kho & bán hàng..." />;

  const isEmpty = !rawData.items || rawData.items.length === 0;

  const hasRunId = !!(rawData.run?.run_id || rawData.run?.id || uiData.report?.runId);
  const applicableRecommendations = rawData.items?.filter(i => (!i.status || i.status === 'PENDING') && i.suggested_import_quantity > 0) || [];
  const applicableRecommendationsCount = applicableRecommendations.length;
  
  const canCreatePlan = hasRunId && applicableRecommendationsCount > 0 && !bulkPlanId;

  if (process.env.NODE_ENV === 'development') {
    console.log('[AI CREATE PLAN STATE]', {
      runId: uiData.report?.runId,
      rawRunId: rawData.run?.run_id,
      isCreatingPlan: false,
      hasActivePlan: !!bulkPlanId,
      urgentProductsCount: uiData.report?.urgentProducts?.length,
      forecastProductsCount: rawData.items?.length,
      recommendationsCount: rawData.items?.length,
      reorderRecommendationsCount: applicableRecommendationsCount,
      applicableRecommendationsCount,
      canCreatePlan
    });
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-500" />
            AI Dự báo
          </h1>
          <p className="text-slate-500 mt-1">Phân tích dữ liệu bán hàng và tồn kho để gợi ý nhập hàng</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => navigate('/settings?tab=ai')}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 h-9"
          >
            <Settings className="w-4 h-4" />
            Cài đặt AI
          </button>
          
          <button 
            onClick={handleAnalyzeClick}
            disabled={analyzing}
            title="Hệ thống sẽ phân tích lịch sử bán hàng, dự báo nhu cầu và đưa ra gợi ý nhập kho."
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed h-9 shadow-sm"
          >
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
            {analyzing ? 'Đang phân tích...' : 'Chạy phân tích AI'}
          </button>
        </div>
      </div>

      {isEmpty ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Box className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Chưa có dữ liệu dự báo</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-6">
            Bạn có thể chạy dự báo nội bộ từ dữ liệu sản phẩm, đơn hàng và tồn kho hiện tại. Nếu muốn AI viết nhận xét thông minh hơn, hãy cấu hình Gemini API trong Cài đặt AI.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button 
              onClick={handleAnalyzeClick}
              disabled={analyzing}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
              {analyzing ? 'Đang phân tích...' : 'Chạy phân tích AI'}
            </button>
            <button 
              onClick={() => navigate('/settings?tab=ai')}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              Cài đặt AI
            </button>
          </div>
        </div>
      ) : (
        <div className="relative space-y-6">
          {analyzing && (
            <div className="absolute inset-0 z-50 bg-white/40 backdrop-blur-[2px] rounded-xl pointer-events-none">
              <div className="sticky top-[40vh] flex items-center justify-center pointer-events-auto w-full mx-auto px-4 md:px-0 md:w-auto">
                <AIAnalysisProgress 
                  value={progressData.value} 
                  label={progressData.label} 
                  description={progressData.description} 
                  onComplete={handleProgressComplete}
                />
              </div>
            </div>
          )}

          <div className={`space-y-6 transition-all duration-300 ${analyzing ? 'opacity-40 pointer-events-none select-none blur-[2px]' : ''}`}>
            {/* 3 & 4. Report and Suggestions */}
            <LazyRevealSection minHeight={400}>
            <AIAnalysisReport report={uiData.report} />
          </LazyRevealSection>

          {/* 5 & 6. Chart and Actions */}
          <LazyRevealSection minHeight={400}>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full min-w-0">
              <div className="xl:col-span-2">
                <AIForecastChart data={uiData.chartData} />
              </div>
              <div className="xl:col-span-1 h-full">
                <AIRecommendedActions 
                  actions={uiData.actions} 
                  onApplyAll={handleApplyAllClick}
                  bulkPlanId={bulkPlanId}
                  canCreatePlan={canCreatePlan}
                  hasRunId={hasRunId}
                />
              </div>
            </div>
          </LazyRevealSection>

          {/* 5. Product Forecast Table */}
          <LazyRevealSection minHeight={600}>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-4 justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Box className="w-5 h-5 text-blue-600" />
                    Chi tiết sản phẩm & Gợi ý nhập kho
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Dữ liệu dự báo 14 ngày tới dựa trên phân tích {rawData.run?.provider === 'Rule-based' ? 'nội bộ' : 'AI'}</p>
                </div>
              </div>
              <AIProductForecastTable 
                categories={categories} 
                data={rawData.items}
                onApplySuggestion={handleApplySingleClick} 
              />
            </div>
          </LazyRevealSection>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, type: null, product: null })}
        onConfirm={confirmAction}
        title={
          modalState.type === 'analyze' ? 'Xác nhận phân tích AI' :
          modalState.type === 'applyAll' ? 'Tạo kế hoạch nhập hàng' :
          'Áp dụng gợi ý nhập hàng'
        }
        message={
          modalState.type === 'analyze' ? 'Hệ thống sẽ đọc dữ liệu bán hàng và tồn kho hiện tại để tạo dự báo mới. Bạn có muốn tiếp tục không?' :
          modalState.type === 'applyAll' ? 'Hệ thống sẽ tạo một kế hoạch nhập cho các sản phẩm được AI đề xuất. Bạn có thể kiểm tra và điều chỉnh số lượng trước khi nhập kho.' :
          `Hệ thống sẽ tạo phiếu nhập nháp cho "${modalState.product?.product_name}" với số lượng ${modalState.product?.suggested_import_quantity}. Tồn kho chỉ thay đổi sau khi bạn xác nhận nhập kho.`
        }
        confirmText={
          modalState.type === 'analyze' ? 'Tiếp tục' :
          modalState.type === 'applyAll' ? 'Tạo kế hoạch' :
          'Tạo phiếu nhập'
        }
      />
    </div>
  );
}
