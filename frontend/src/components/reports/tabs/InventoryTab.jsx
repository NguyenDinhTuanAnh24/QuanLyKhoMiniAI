import React from 'react';
import StatCard from '../../StatCard';
import { Package, Archive, AlertTriangle, AlertOctagon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function InventoryTab({ data, loading }) {
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
          label="Tổng sản phẩm" 
          value={formatNumber(summary.total_products)} 
          icon={Package} 
          iconColorClass="bg-blue-50 text-blue-600" 
        />
        <StatCard 
          label="Tổng giá trị tồn kho" 
          value={formatCurrency(summary.inventory_value)} 
          icon={Archive} 
          iconColorClass="bg-indigo-50 text-indigo-600" 
        />
        <StatCard 
          label="Sản phẩm cần nhập" 
          value={formatNumber(summary.needs_import)} 
          icon={AlertTriangle} 
          iconColorClass="bg-amber-50 text-amber-600" 
        />
        <StatCard 
          label="Sản phẩm hết hàng" 
          value={formatNumber(summary.out_of_stock)} 
          icon={AlertOctagon} 
          iconColorClass="bg-red-50 text-red-600" 
        />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm h-[400px] flex flex-col">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Tồn kho theo danh mục</h3>
        <div className="flex-1 w-full h-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="category" 
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
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar 
                  dataKey="stock" 
                  name="Tồn kho"
                  fill="#8b5cf6" 
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
          <h3 className="text-lg font-bold text-slate-800">Chi tiết tồn kho</h3>
        </div>
        <div className="overflow-x-auto">
          {tableData.length > 0 ? (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">Sản phẩm</th>
                  <th className="px-5 py-3">Danh mục</th>
                  <th className="px-5 py-3 text-right">Tồn kho</th>
                  <th className="px-5 py-3 text-right">Mức tồn tối thiểu</th>
                  <th className="px-5 py-3 text-right">Giá nhập</th>
                  <th className="px-5 py-3 text-right">Giá trị tồn</th>
                  <th className="px-5 py-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tableData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-500">{row.sku}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{row.product_name}</td>
                    <td className="px-5 py-3 text-slate-600">{row.category}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-800">{formatNumber(row.stock_quantity)}</td>
                    <td className="px-5 py-3 text-right text-slate-500">{formatNumber(row.reorder_level)}</td>
                    <td className="px-5 py-3 text-right text-slate-500">{formatCurrency(row.import_price)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-700">{formatCurrency(row.inventory_value)}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border
                        ${row.status === 'Hết hàng' ? 'bg-red-50 text-red-700 border-red-200' : 
                          row.status === 'Sắp hết' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                          'bg-emerald-50 text-emerald-700 border-emerald-200'}`}
                      >
                        {row.status}
                      </span>
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
