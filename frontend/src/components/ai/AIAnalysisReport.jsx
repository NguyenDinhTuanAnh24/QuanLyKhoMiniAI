import React from 'react';
import { TrendingUp, AlertTriangle, PackageSearch, CalendarDays, Inbox, Zap, Info } from 'lucide-react';

export default function AIAnalysisReport({ report }) {
  const currentDate = new Date();
  const dateStr = currentDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = currentDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  if (!report) return null;

  // Fallback to old format if it's not the new JSON structure
  const isDetailed = !report.fallback;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm h-full flex flex-col w-full min-w-0">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-500" />
            Báo cáo phân tích chi tiết
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{dateStr} • Cập nhật lúc {timeStr}</p>
        </div>
      </div>
      
      <div className="p-5 flex-1 overflow-y-auto space-y-8">
        
        {/* 1. Khối Tổng quan */}
        <section>
          <h4 className="font-bold text-slate-800 mb-3 text-base border-b border-slate-100 pb-2">Tổng quan</h4>
          <div className="space-y-3">
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong className="text-slate-900">Doanh thu & Tồn kho: </strong> 
              {isDetailed ? report.overview_comment : report.summary}
            </p>
            {report.inventory_comment && (
              <p className="text-sm text-slate-700 leading-relaxed">
                <strong className="text-slate-900">Tình trạng kho: </strong> 
                {report.inventory_comment}
              </p>
            )}
            {report.sales_comment && (
              <p className="text-sm text-slate-700 leading-relaxed">
                <strong className="text-slate-900">Tốc độ bán hàng: </strong> 
                {report.sales_comment}
              </p>
            )}
          </div>
        </section>

        {/* 2. Grid thống kê nhỏ */}
        {isDetailed && report.summary && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <p className="text-xs text-slate-500 font-medium mb-1">Tổng SP phân tích</p>
              <p className="text-lg font-bold text-slate-900">{report.summary.total_products}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg border border-red-100">
              <p className="text-xs text-red-600 font-medium mb-1">Cần nhập gấp</p>
              <p className="text-lg font-bold text-red-700">{report.summary.need_import_count}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
              <p className="text-xs text-orange-600 font-medium mb-1">Bán chậm / Tồn lâu</p>
              <p className="text-lg font-bold text-orange-700">{report.summary.slow_moving_count}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-600 font-medium mb-1">Đề xuất nhập tổng</p>
              <p className="text-lg font-bold text-blue-700">{report.summary.total_suggested_import_quantity} SP</p>
            </div>
          </section>
        )}

        {/* 3. Sản phẩm cần nhập gấp */}
        <section>
          <h4 className="font-bold text-slate-800 mb-3 text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Sản phẩm cần nhập gấp
          </h4>
          {report.urgent_import_products && report.urgent_import_products.length > 0 ? (
            <div className="space-y-3">
              {report.urgent_import_products.slice(0, 5).map((p, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-lg p-3 text-sm flex flex-col gap-2 shadow-sm">
                  <div className="flex justify-between items-start font-medium">
                    <span className="text-slate-900 line-clamp-1 flex-1 pr-2">{p.product_name}</span>
                    <span className="text-red-600 whitespace-nowrap shrink-0">Nhập: +{p.suggested_import_quantity ?? p.suggested_quantity ?? 0}</span>
                  </div>
                  <div className="text-xs text-slate-500 flex gap-4">
                    <span>Tồn: {p.stock_quantity ?? 0}</span>
                    <span>Dự báo: {p.forecast_quantity ?? p.forecast_14d ?? 0}</span>
                  </div>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded italic mt-1">{p.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">Chưa có đủ dữ liệu cho nhóm này.</p>
          )}
        </section>

        {/* 4. Sản phẩm bán chạy */}
        <section>
          <h4 className="font-bold text-slate-800 mb-3 text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            Sản phẩm bán chạy
          </h4>
          {report.top_selling_products && report.top_selling_products.length > 0 ? (
            <div className="space-y-2">
              {report.top_selling_products.slice(0, 5).map((p, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-lg p-3 text-sm shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="font-medium text-slate-900">{p.product_name}</div>
                  <div className="text-xs text-slate-600 bg-green-50 px-2 py-1 rounded text-right whitespace-nowrap shrink-0">{p.reason || 'Bán chạy ổn định'}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">Chưa có đủ dữ liệu cho nhóm này.</p>
          )}
        </section>

        {/* 5. Sản phẩm bán chậm */}
        <section>
          <h4 className="font-bold text-slate-800 mb-3 text-base flex items-center gap-2">
            <PackageSearch className="w-4 h-4 text-orange-500" />
            Sản phẩm bán chậm / Tồn đọng
          </h4>
          {report.slow_moving_products && report.slow_moving_products.length > 0 ? (
            <div className="space-y-2">
              {report.slow_moving_products.slice(0, 5).map((p, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-lg p-3 text-sm shadow-sm">
                  <div className="font-medium text-slate-900 mb-1">{p.product_name}</div>
                  <p className="text-xs text-slate-600 bg-orange-50 px-2 py-1 rounded w-fit">{p.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">Chưa có đủ dữ liệu cho nhóm này.</p>
          )}
        </section>

      </div>
    </div>
  );
}
