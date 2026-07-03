import React from 'react';
import StatCard from '../../StatCard';
import { DollarSign, ShoppingCart, TrendingUp, Tag } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function RevenueTab({ data, loading }) {
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatNumber = (value) => {
    if (value === undefined || value === null) return '0';
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
    return dateStr;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-24 animate-pulse" />
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 h-[400px] animate-pulse" />
      </div>
    );
  }

  const { summary = {}, chartData = [], categoryChartData = [], tableData = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Tổng doanh thu" 
          value={formatCurrency(summary.total_revenue)} 
          icon={DollarSign} 
          iconColorClass="bg-green-50 text-green-600" 
        />
        <StatCard 
          label="Số đơn hàng" 
          value={formatNumber(summary.total_orders)} 
          icon={ShoppingCart} 
          iconColorClass="bg-blue-50 text-blue-600" 
        />
        <StatCard 
          label="Giá trị TB/đơn" 
          value={formatCurrency(summary.avg_order_value)} 
          icon={Tag} 
          iconColorClass="bg-purple-50 text-purple-600" 
        />
        <StatCard 
          label="Lợi nhuận ước tính" 
          value={formatCurrency(summary.estimated_profit)} 
          icon={TrendingUp} 
          iconColorClass="bg-orange-50 text-orange-600" 
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm h-[400px] flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Biểu đồ doanh thu theo ngày</h3>
          <div className="flex-1 w-full h-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                      if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                      return value;
                    }}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dx={-10}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                    labelFormatter={formatDate}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#2563eb" 
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
                    activeDot={{ r: 6, strokeWidth: 0 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">Không có dữ liệu</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm h-[400px] flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Doanh thu theo danh mục</h3>
          <div className="flex-1 w-full h-full">
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="category" 
                    type="category" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">Không có dữ liệu</div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-bold text-slate-800">Chi tiết doanh thu</h3>
        </div>
        <div className="overflow-x-auto">
          {tableData.length > 0 ? (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3">Ngày</th>
                  <th className="px-5 py-3 text-right">Số đơn</th>
                  <th className="px-5 py-3 text-right">Doanh thu</th>
                  <th className="px-5 py-3 text-right">Giảm giá</th>
                  <th className="px-5 py-3 text-right">Doanh thu thuần</th>
                  <th className="px-5 py-3 text-right">Lợi nhuận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tableData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-800">{formatDate(row.date)}</td>
                    <td className="px-5 py-3 text-right">{formatNumber(row.orders_count)}</td>
                    <td className="px-5 py-3 text-right font-medium text-slate-700">{formatCurrency(row.revenue)}</td>
                    <td className="px-5 py-3 text-right text-slate-500">{formatCurrency(row.discount)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-blue-600">{formatCurrency(row.net_revenue)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-emerald-600">{formatCurrency(row.profit)}</td>
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
