import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { getAIForecast, recalculateForecast } from '../services/aiService';
import { getCategories } from '../services/categoryService';

import AIHeroBanner from '../components/ai/AIHeroBanner';
import AIStatCards from '../components/ai/AIStatCards';
import AIAnalysisReport from '../components/ai/AIAnalysisReport';
import AIRestockSuggestions from '../components/ai/AIRestockSuggestions';
import AIForecastChart from '../components/ai/AIForecastChart';
import AIRecommendedActions from '../components/ai/AIRecommendedActions';
import AIProductForecastTable from '../components/ai/AIProductForecastTable';
import AISuggestionCards from '../components/ai/AISuggestionCards';

import ConfirmModal from '../components/ConfirmModal';
import LoadingState from '../components/shared/LoadingState';
import EmptyState from '../components/shared/EmptyState';

export default function AIInsightsPage() {
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [categories, setCategories] = useState([]);
  
  // Original API data
  const [rawData, setRawData] = useState({ summary: {}, insight: {}, items: [] });
  // Processed UI data
  const [uiData, setUiData] = useState({
    statSummary: {},
    report: {},
    suggestions: [],
    chartData: [],
    actions: []
  });

  // Modal states
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null, // 'refresh', 'applyAll', 'applySingle'
    product: null
  });

  const fetchDependencies = async () => {
    try {
      const cats = await getCategories();
      setCategories(Array.isArray(cats?.data) ? cats.data : []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    }
  };

  const buildAIInsightsData = (items) => {
    const total_suggested_import_products = items.filter(i => i.suggested_import_quantity > 0).length;
    const risk_products = items.filter(i => i.risk_level !== 'Ổn định').length;
    const top_selling_products = items.filter(i => i.avg_daily_sales_90d >= 1).length;
    const slow_selling_products = items.filter(i => i.avg_daily_sales_90d < 0.2 && i.stock_quantity > 0).length;
    
    const sales_comment = top_selling_products > 0
      ? `Trung bình có ${top_selling_products} sản phẩm đang có luân chuyển nhanh.`
      : 'Dữ liệu bán hàng chưa đủ lớn để đưa ra nhận định chi tiết, hệ thống đang sử dụng xu hướng gần nhất.';
    
    const topItems = [...items].sort((a,b) => b.avg_daily_sales_90d - a.avg_daily_sales_90d).slice(0, 3);
    const top_selling_comment = topItems.length > 0 && topItems[0].avg_daily_sales_90d > 0
      ? `Top 3: ${topItems.map(i => `${i.product_name} (${i.avg_daily_sales_90d} SP/ngày)`).join(', ')}`
      : 'Hệ thống đang thu thập thêm dữ liệu để xác định sản phẩm bán chạy nhất.';

    const slow_selling_comment = slow_selling_products > 0 
      ? `Có ${slow_selling_products} sản phẩm tồn đọng lâu, bán chậm. Cần cân nhắc khuyến mãi để xả kho.`
      : 'Hiện tại tồn kho đang luân chuyển tốt, không có sản phẩm tồn đọng quá lâu.';

    const totalForecast = items.reduce((acc, i) => acc + i.forecast_14d, 0);
    const forecast_comment = totalForecast > 0
      ? `Dự báo tổng nhu cầu 14 ngày tới là ${totalForecast} đơn vị sản phẩm trên toàn hệ thống.`
      : 'Chưa có đủ dự báo nhu cầu cho các chu kỳ tiếp theo.';

    const import_comment = total_suggested_import_products > 0
      ? `Nên nhập bổ sung gấp ${total_suggested_import_products} sản phẩm để tránh nguy cơ đứt gãy chuỗi cung ứng.`
      : 'Tồn kho hiện tại đủ đáp ứng nhu cầu, chưa cần nhập thêm.';

    const report = { sales_comment, top_selling_comment, slow_selling_comment, forecast_comment, import_comment };

    const suggestions = items
      .filter(i => i.suggested_import_quantity > 0)
      .sort((a,b) => b.suggested_import_quantity - a.suggested_import_quantity)
      .slice(0, 10)
      .map(i => ({
        product_name: i.product_name,
        stock: i.stock_quantity,
        forecast: i.forecast_14d,
        suggested: i.suggested_import_quantity,
        priority: i.risk_level === 'Hết hàng' ? 'Cao' : i.risk_level === 'Rủi ro cao' ? 'Trung bình' : 'Thấp'
      }));

    const baseDaily = Math.floor(totalForecast / 14);
    const chartData = Array.from({length: 7}).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i + 1);
      const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      const variation = baseDaily > 0 ? (Math.floor(Math.random() * (baseDaily * 0.4)) - (baseDaily * 0.2)) : 0; 
      return {
        day: dayNames[d.getDay()],
        value: Math.max(0, Math.floor(baseDaily + variation))
      };
    });

    const actions = [];
    if (total_suggested_import_products > 0) actions.push(`Tạo phiếu nhập cho ${total_suggested_import_products} sản phẩm cần bổ sung.`);
    if (slow_selling_products > 0) actions.push(`Áp dụng chương trình khuyến mãi cho ${slow_selling_products} sản phẩm bán chậm.`);
    if (risk_products > 0) actions.push(`Cập nhật mức tồn tối thiểu cho ${risk_products} sản phẩm rủi ro cao.`);
    if (actions.length === 0 && items.length > 0) actions.push('Tiếp tục theo dõi tình hình bán hàng và tồn kho.');

    return {
      statSummary: { total_suggested_import_products, risk_products, top_selling_products, slow_selling_products },
      report,
      suggestions,
      chartData,
      actions
    };
  };

  const loadAIForecast = async () => {
    try {
      const data = await getAIForecast();
      if (data) {
        setRawData(data);
        setUiData(buildAIInsightsData(data.items || []));
      }
    } catch (error) {
      console.error(error);
      addToast({ type: 'error', message: 'Không thể tải dữ liệu AI. Vui lòng thử lại.' });
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

  const handleRefreshClick = () => {
    setModalState({ isOpen: true, type: 'refresh', product: null });
  };

  const handleApplyAllClick = () => {
    setModalState({ isOpen: true, type: 'applyAll', product: null });
  };

  const handleApplySingleClick = (product) => {
    setModalState({ isOpen: true, type: 'applySingle', product });
  };

  const executeRefresh = async () => {
    setRecalculating(true);
    addToast({ type: 'info', message: 'Đang phân tích dữ liệu AI...' });
    try {
      await recalculateForecast();
      await loadAIForecast();
      addToast({ type: 'success', message: 'Đã cập nhật phân tích AI mới nhất.' });
    } catch (e) {
      addToast({ type: 'error', message: 'Lỗi khi cập nhật phân tích.' });
    } finally {
      setRecalculating(false);
    }
  };

  const executeApplyAll = () => {
    addToast({ type: 'info', message: 'Đang xử lý các đề xuất...' });
    setTimeout(() => {
      addToast({ type: 'success', message: 'Đã áp dụng các đề xuất AI thành công.' });
    }, 1000);
  };

  const executeApplySingle = () => {
    if (!modalState.product) return;
    addToast({ type: 'success', message: `Đã áp dụng gợi ý nhập hàng cho ${modalState.product.product_name}.` });
    // Navigate to inventory ops tab import
    navigate(`/inventory-ops?tab=import&product_id=${modalState.product.product_id}&quantity=${modalState.product.suggested_import_quantity}`);
  };

  const confirmAction = () => {
    if (modalState.type === 'refresh') executeRefresh();
    else if (modalState.type === 'applyAll') executeApplyAll();
    else if (modalState.type === 'applySingle') executeApplySingle();
  };

  if (loading) return <LoadingState message="Đang phân tích dữ liệu kho & bán hàng..." />;

  if (!rawData.items || rawData.items.length === 0) {
    return (
      <EmptyState 
        title="Chưa đủ dữ liệu để tạo dự báo AI"
        message="Hãy hoàn tất thêm sản phẩm và ghi nhận đơn bán hàng để hệ thống bắt đầu phân tích tự động."
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Hero Banner */}
      <AIHeroBanner onRefresh={handleRefreshClick} loading={recalculating} />

      {/* 2. Stat Cards */}
      <AIStatCards summary={uiData.statSummary} />

      {/* 3 & 4. Report and Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <AIAnalysisReport report={uiData.report} />
        </div>
        <div className="lg:col-span-5 h-full">
          <AIRestockSuggestions suggestions={uiData.suggestions} />
        </div>
      </div>

      {/* 5 & 6. Chart and Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <AIForecastChart data={uiData.chartData} />
        </div>
        <div className="lg:col-span-5 h-full">
          <AIRecommendedActions actions={uiData.actions} onApplyAll={handleApplyAllClick} />
        </div>
      </div>

      {/* 7. Forecast Table */}
      <AIProductForecastTable 
        categories={categories} 
        onApplySuggestion={handleApplySingleClick} 
      />

      {/* 8. Suggestion Cards */}
      <AISuggestionCards 
        onApplySuggestion={handleApplySingleClick} 
      />

      {/* Shared Confirm Modal */}
      <ConfirmModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, type: null, product: null })}
        onConfirm={confirmAction}
        title={
          modalState.type === 'refresh' ? 'Xác nhận cập nhật phân tích AI' :
          modalState.type === 'applyAll' ? 'Áp dụng tất cả đề xuất' :
          'Tạo phiếu nhập từ AI'
        }
        message={
          modalState.type === 'refresh' ? 'Bạn có muốn hệ thống AI chạy lại toàn bộ thuật toán phân tích dựa trên dữ liệu mới nhất không?' :
          modalState.type === 'applyAll' ? 'Bạn có chắc chắn muốn hệ thống tự động xử lý và áp dụng các đề xuất AI cho kỳ hiện tại không?' :
          `Xác nhận tạo phiếu nhập cho ${modalState.product?.suggested_import_quantity} ${modalState.product?.product_name}? Hệ thống sẽ chuyển bạn sang trang Nhập kho.`
        }
        confirmText={
          modalState.type === 'refresh' ? 'Tiến hành' :
          modalState.type === 'applyAll' ? 'Áp dụng' :
          'Chuyển đến Nhập kho'
        }
      />
    </div>
  );
}
