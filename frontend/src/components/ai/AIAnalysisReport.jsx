import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, PackageSearch, Zap, CheckCircle, Info, Tags, Truck, ChevronLeft, ChevronRight, AlertCircle, Target, Sparkles, SearchCheck, Lightbulb } from 'lucide-react';

const asText = (value, fallback = '') => {
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }
  return fallback;
};

export default function AIAnalysisReport({ report }) {
  const [activeTab, setActiveTab] = useState('urgent');
  
  // States for pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // Reset page when tab changes or report changes
  useEffect(() => {
    setPage(1);
  }, [activeTab, report]);

  if (!report) return null;

  const execSummary = report.executiveSummary || report.executive_summary || { 
    status: 'GOOD', 
    overview: report.summary || 'Chưa có phân tích chi tiết.', 
    key_findings: [],
    risks: [],
    opportunities: [],
    recommended_actions: []
  };

  const getStatusConfig = (status) => {
    switch(status) {
      case 'CRITICAL': return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle, label: 'Ưu tiên xử lý' };
      case 'WARNING': return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: Info, label: 'Cần chú ý' };
      default: return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle, label: 'Ổn định' };
    }
  };

  const statusConfig = getStatusConfig(execSummary.status);
  const StatusIcon = statusConfig.icon;

  const tabs = [
    { id: 'urgent', label: 'Cần nhập gấp', icon: AlertTriangle, data: report.urgentProducts || [], emptyText: 'Không có sản phẩm cần nhập gấp.' },
    { id: 'top_selling', label: 'Bán chạy', icon: TrendingUp, data: report.topSellingProducts || [], emptyText: 'Chưa ghi nhận sản phẩm có tốc độ bán nổi bật trong kỳ phân tích.' },
    { id: 'slow_moving', label: 'Bán chậm', icon: PackageSearch, data: report.slowMovingProducts || [], emptyText: 'Không có sản phẩm được xếp vào nhóm bán chậm.' },
    { id: 'categories', label: 'Danh mục', icon: Tags, data: report.categoryInsights || [], emptyText: 'Chưa có đủ dữ liệu để phân tích theo danh mục.' },
    { id: 'suppliers', label: 'Nhà cung cấp', icon: Truck, data: report.supplierInsights || [], emptyText: 'Chưa có đủ dữ liệu để phân tích theo nhà cung cấp.' }
  ];

  const activeTabData = tabs.find(t => t.id === activeTab);
  const activeData = activeTabData?.data || [];
  const totalPages = Math.max(1, Math.ceil(activeData.length / itemsPerPage));
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedData = activeData.slice(startIndex, startIndex + itemsPerPage);

  const renderUrgentItem = (item) => (
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-start gap-2 mb-1">
        <div className="font-bold text-slate-900 truncate">{asText(item.product_name || item.product_id)}</div>
        {item.suggested_import_quantity > 0 && (
          <div className="shrink-0 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
            Cần nhập {item.suggested_import_quantity}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2 text-xs text-slate-500">
        {(item.category_name) && (<span>{item.category_name}</span>)}
        {item.priority && (<span>Priority: {item.priority}</span>)}
        <div className="flex items-center gap-1.5 font-medium">
          <span className="text-slate-600">Tồn: {item.stock_quantity ?? 0}</span>
          <span>·</span>
          <span className="text-slate-600">An toàn: {item.reorder_level ?? 0}</span>
          <span>·</span>
          <span className="text-slate-600">Dự báo: {item.forecast_quantity ?? item.forecast_14d ?? 0}</span>
        </div>
      </div>
      <p className="text-slate-600 line-clamp-2 text-xs leading-relaxed">{asText(item.reason || item.comment)}</p>
    </div>
  );

  const renderTopSellingItem = (item) => (
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-start gap-2 mb-1">
        <div className="font-bold text-slate-900 truncate">{asText(item.product_name || item.product_id)}</div>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2 text-xs text-slate-500">
        {(item.category_name) && (<span>{item.category_name}</span>)}
        <div className="flex items-center gap-1.5 font-medium">
          <span className="text-emerald-600">Đã bán: {item.sales_90d ?? 0}</span>
          <span>·</span>
          <span className="text-emerald-600">TB/ngày: {item.avg_daily_sales_90d ?? item.avg_daily_sales ?? 0}</span>
          <span>·</span>
          <span className="text-slate-600">Tồn: {item.stock_quantity ?? 0}</span>
        </div>
      </div>
      <p className="text-slate-600 line-clamp-2 text-xs leading-relaxed">{asText(item.reason || item.comment)}</p>
    </div>
  );

  const renderSlowMovingItem = (item) => (
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-start gap-2 mb-1">
        <div className="font-bold text-slate-900 truncate">{asText(item.product_name || item.product_id)}</div>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="text-amber-600">Tồn: {item.stock_quantity ?? 0}</span>
          <span>·</span>
          <span className="text-slate-600">Đã bán: {item.sales_90d ?? 0}</span>
          {item.last_sold_date && (
            <>
              <span>·</span>
              <span className="text-slate-600">Lần cuối: {new Date(item.last_sold_date).toLocaleDateString('vi-VN')}</span>
            </>
          )}
        </div>
      </div>
      <p className="text-slate-600 line-clamp-2 text-xs leading-relaxed">{asText(item.reason || item.comment)}</p>
    </div>
  );

  const renderCategoryItem = (item) => (
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-start gap-2 mb-1">
        <div className="font-bold text-slate-900 truncate">{asText(item.category_name)}</div>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="text-slate-600">Sản phẩm: {item.total_products ?? 0}</span>
          <span>·</span>
          <span className="text-red-600">Cần nhập: {item.need_import_count ?? 0}</span>
          <span>·</span>
          <span className="text-slate-600">Tổng tồn: {item.total_stock ?? 0}</span>
          <span>·</span>
          <span className="text-emerald-600">Tổng bán: {item.total_sales ?? 0}</span>
        </div>
      </div>
      <p className="text-slate-600 line-clamp-2 text-xs leading-relaxed">{asText(item.reason || item.comment)}</p>
    </div>
  );

  const renderSupplierItem = (item) => (
    <div className="flex-1 min-w-0">
      <div className="font-semibold text-slate-900 mb-2">{asText(item.supplier_name)}</div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-600 mb-1">
        <span>{item.product_count ?? 0} sản phẩm</span>
        <span>·</span>
        <span className="text-red-600 font-medium">{item.need_import_count ?? 0} cần nhập</span>
      </div>
      <div className="text-sm text-slate-600 mb-1">
        Tổng cần nhập: <span className="font-medium text-slate-900">{item.total_suggested_import_quantity ?? 0} đơn vị</span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-600 mb-4">
        <span>Tồn thấp: {item.low_stock_count ?? 0}</span>
        <span>·</span>
        <span>Hết hàng: {item.out_of_stock_count ?? 0}</span>
      </div>

      {Array.isArray(item.insights) && item.insights.length > 0 && (
        <div className="mb-3">
          <div className="text-sm font-medium text-slate-800 mb-1">Nhận xét</div>
          <ul className="space-y-1.5 pl-0">
            {item.insights.map((insight, i) => (
              <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-blue-400 mt-2 shrink-0"></span>
                <span>{asText(insight)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {Array.isArray(item.recommendations) && item.recommendations.length > 0 && (
        <div>
          <div className="text-sm font-medium text-slate-800 mb-1">Khuyến nghị</div>
          <ul className="space-y-1.5 pl-0">
            {item.recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-emerald-400 mt-2 shrink-0"></span>
                <span>{asText(rec)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    if (activeData.length === 0) {
      return (
        <div className="py-6 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
            <activeTabData.icon className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm text-slate-500 font-medium">{activeTabData.emptyText}</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        <div className="space-y-4 mt-5 flex-1">
          {paginatedData.map((item, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col sm:flex-row gap-4">
              <div className="w-1.5 h-auto rounded-full bg-blue-400 shrink-0 hidden sm:block"></div>
              {activeTab === 'urgent' && renderUrgentItem(item)}
              {activeTab === 'top_selling' && renderTopSellingItem(item)}
              {activeTab === 'slow_moving' && renderSlowMovingItem(item)}
              {activeTab === 'categories' && renderCategoryItem(item)}
              {activeTab === 'suppliers' && renderSupplierItem(item)}
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, activeData.length)} / {activeData.length}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-slate-600">Trang {page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-auto w-full min-w-0">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl shrink-0">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          Tổng quan AI
        </h3>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {statusConfig.label}
        </div>
      </div>
      
      <div className="p-5 md:p-6 flex-1">
        {/* Executive Summary */}
        <div className="mb-8 space-y-6">
          {/* Overview */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-slate-500" />
              Tổng quan
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed">
              {asText(execSummary.overview, 'Hệ thống đã phân tích dữ liệu nhưng chưa tạo đoạn tổng quan chi tiết.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Key Findings */}
            {Array.isArray(execSummary.key_findings) && execSummary.key_findings.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                  <SearchCheck className="w-4 h-4 text-blue-500" />
                  Phát hiện chính
                </h4>
                <ul className="space-y-2.5">
                  {execSummary.key_findings.map((point, idx) => (
                    <li key={idx} className="text-sm text-slate-600 flex items-start gap-2 leading-relaxed">
                      <span className="w-1 h-1 rounded-full bg-slate-400 mt-2 shrink-0"></span>
                      <span>{asText(point)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risks */}
            {Array.isArray(execSummary.risks) && execSummary.risks.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  Rủi ro cần lưu ý
                </h4>
                <ul className="space-y-2.5">
                  {execSummary.risks.map((point, idx) => (
                    <li key={idx} className="text-sm text-slate-600 flex items-start gap-2 leading-relaxed">
                      <span className="w-1 h-1 rounded-full bg-red-400 mt-2 shrink-0"></span>
                      <span>{asText(point)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Opportunities */}
            {Array.isArray(execSummary.opportunities) && execSummary.opportunities.length > 0 && (
              <div className="md:col-span-2">
                <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Cơ hội tối ưu
                </h4>
                <ul className="space-y-2.5">
                  {execSummary.opportunities.map((point, idx) => (
                    <li key={idx} className="text-sm text-slate-600 flex items-start gap-2 leading-relaxed">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 mt-2 shrink-0"></span>
                      <span>{asText(point)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-t border-slate-100 pt-6">
          <h4 className="font-bold text-slate-900 mb-4 text-base">Chi tiết phân tích</h4>
          
          <div className="flex overflow-x-auto gap-3 border-b border-slate-200 pb-px scrollbar-hide">
            {tabs.map(tab => {
              const count = tab.data?.length || 0;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  <span className={`ml-1 text-xs py-0.5 px-1.5 rounded-full ${
                    activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          
          <div className="mt-2 min-h-[250px] flex flex-col">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
