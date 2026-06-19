import React from 'react';
import StatCard from '../../StatCard';
import { Truck, PackagePlus, DollarSign, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ImportsTab({ data, loading }) {
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
    // Support ISO string fallback
    if (dateStr.includes('T')) {
      const dateOnly = dateStr.split('T')[0];
      const dp = dateOnly.split('-');
      if (dp.length === 3) return `${dp[2]}/${dp[1]}/${dp[0]}`;
    }
    return dateStr;
  };

  const formatFullDate = (dateStr) => {
    if (!dateStr) return '';
    if (dateStr.includes('T')) {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
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

  const { summary = {}, chartData = [], tableData = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Tổng phiếu nhập" 
          value={formatNumber(summary.total_vouchers)} 
          icon={Truck} 
          iconColorClass="bg-blue-50 text-blue-600" 
        />
        <StatCard 
          label="Tổng số lượng nhập" 
          value={formatNumber(summary.total_quantity)} 
          icon={PackagePlus} 
          iconColorClass="bg-emerald-50 text-emerald-600" 
        />
        <StatCard 
          label="Tổng giá trị nhập" 
          value={formatCurrency(summary.total_value)} 
          icon={DollarSign} 
          iconColorClass="bg-indigo-50 text-indigo-600" 
        />
        <StatCard 
          label="NCC nhập nhiều nhất" 
          value={summary.top_supplier} 
          icon={Award} 
          iconColorClass="bg-amber-50 text-amber-600" 
        />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm h-[400px] flex flex-col">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Số lượng nhập kho theo ngày</h3>
        <div className="flex-1 w-full h-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
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
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dx={-10}
                />
                <Tooltip 
                  labelFormatter={formatDate}
                  formatter={(value) => [formatNumber(value), 'Số lượng nhập']}
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar 
                  dataKey="quantity" 
                  name="Số lượng nhập"
                  fill="#0ea5e9" 
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">Không có dữ liệu</div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-bold text-slate-800">Lịch sử nhập hàng</h3>
        </div>
        <div className="overflow-x-auto">
          {tableData.length > 0 ? (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3">Thời gian</th>
                  <th className="px-5 py-3">Sản phẩm</th>
                  <th className="px-5 py-3">Nhà cung cấp</th>
                  <th className="px-5 py-3 text-right">Số lượng</th>
                  <th className="px-5 py-3 text-right">Giá nhập</th>
                  <th className="px-5 py-3 text-right">Thành tiền</th>
                  <th className="px-5 py-3">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tableData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-700 whitespace-nowrap">{formatFullDate(row.date)}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{row.product_name}</td>
                    <td className="px-5 py-3 text-slate-600">{row.supplier}</td>
                    <td className="px-5 py-3 text-right font-bold text-blue-600">{formatNumber(row.quantity)}</td>
                    <td className="px-5 py-3 text-right text-slate-500">{formatCurrency(row.unit_price)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-800">{formatCurrency(row.total)}</td>
                    <td className="px-5 py-3 text-slate-500 max-w-[200px] truncate" title={row.note}>{row.note || '-'}</td>
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
