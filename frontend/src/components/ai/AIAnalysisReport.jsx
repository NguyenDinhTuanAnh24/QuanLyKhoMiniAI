import React from 'react';
import { TrendingUp, AlertTriangle, PackageSearch, CalendarDays, Inbox } from 'lucide-react';

export default function AIAnalysisReport({ report }) {
  const currentDate = new Date();
  const dateStr = currentDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = currentDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  if (!report) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm h-full flex flex-col">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Báo cáo phân tích hôm nay</h3>
          <p className="text-xs text-slate-500 mt-0.5">{dateStr} • Cập nhật lúc {timeStr}</p>
        </div>
      </div>
      
      <div className="p-5 flex-1 flex flex-col justify-between gap-6">
        {/* Nhận xét doanh thu */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 text-sm mb-1">Nhận xét bán hàng</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              {report.sales_comment || 'Dữ liệu bán hàng chưa đủ lớn để đưa ra nhận định chi tiết, hệ thống đang sử dụng xu hướng gần nhất.'}
            </p>
          </div>
        </div>

        {/* Sản phẩm bán chạy */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <PackageSearch className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 text-sm mb-1">Sản phẩm bán chạy</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              {report.top_selling_comment || 'Hệ thống đang thu thập thêm dữ liệu để xác định sản phẩm bán chạy nhất.'}
            </p>
          </div>
        </div>

        {/* Cảnh báo bán chậm */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 text-sm mb-1">Cảnh báo sản phẩm bán chậm</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              {report.slow_selling_comment || 'Hiện tại không có báo cáo về sản phẩm tồn đọng lâu ngày.'}
            </p>
          </div>
        </div>

        {/* Dự báo 7 ngày tới */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 text-sm mb-1">Dự báo nhu cầu sắp tới</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              {report.forecast_comment || 'Xu hướng nhu cầu trong 7 ngày tới đang ở mức trung bình ổn định.'}
            </p>
          </div>
        </div>

        {/* Gợi ý nhập hàng */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 text-sm mb-1">Đề xuất nhập hàng</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              {report.import_comment || 'Không có đề xuất nhập hàng khẩn cấp nào tại thời điểm này.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
