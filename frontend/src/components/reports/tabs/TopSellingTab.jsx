import React from 'react';
import StatCard from '../../StatCard';
import { Star, Package, DollarSign } from 'lucide-react';

export default function TopSellingTab({ data, loading }) {
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatNumber = (value) => {
    if (value === undefined || value === null) return '0';
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-24 animate-pulse" />
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 h-[400px] animate-pulse" />
      </div>
    );
  }

  const { summary = {}, tableData = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Sản phẩm bán chạy nhất" 
          value={summary.top_product || 'Không có'} 
          icon={Star} 
          iconColorClass="bg-yellow-50 text-yellow-600" 
        />
        <StatCard 
          label="Tổng số lượng bán (Top)" 
          value={formatNumber(summary.total_sold)} 
          icon={Package} 
          iconColorClass="bg-blue-50 text-blue-600" 
        />
        <StatCard 
          label="Doanh thu từ Top sản phẩm" 
          value={formatCurrency(summary.top_revenue)} 
          icon={DollarSign} 
          iconColorClass="bg-green-50 text-green-600" 
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-bold text-slate-800">Top 10 sản phẩm bán chạy</h3>
        </div>
        <div className="overflow-x-auto">
          {tableData.length > 0 ? (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-center w-16">STT</th>
                  <th className="px-5 py-3">Sản phẩm</th>
                  <th className="px-5 py-3">Mã SKU</th>
                  <th className="px-5 py-3">Danh mục</th>
                  <th className="px-5 py-3 text-right">Số lượng bán</th>
                  <th className="px-5 py-3 text-right">Doanh thu</th>
                  <th className="px-5 py-3 text-right">Tỷ trọng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tableData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-center font-bold text-slate-500">
                      {row.rank === 1 ? <span className="text-yellow-500">1</span> :
                       row.rank === 2 ? <span className="text-slate-400">2</span> :
                       row.rank === 3 ? <span className="text-amber-600">3</span> : row.rank}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800">{row.product_name}</td>
                    <td className="px-5 py-3 text-slate-500">{row.sku}</td>
                    <td className="px-5 py-3 text-slate-600">{row.category}</td>
                    <td className="px-5 py-3 text-right font-bold text-emerald-600">{formatNumber(row.sold_quantity)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-700">{formatCurrency(row.revenue)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs font-medium text-slate-500">{row.percentage.toFixed(1)}%</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${row.percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-400">Không có dữ liệu</div>
          )}
        </div>
      </div>
    </div>
  );
}
