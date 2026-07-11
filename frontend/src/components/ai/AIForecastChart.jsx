import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LineChart } from 'lucide-react';

export default function AIForecastChart({ data }) {
  // If recharts fails or we want a simpler view, we can use recharts since it's verified to work.
  
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <LineChart className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-bold text-slate-900">Dự báo nhu cầu 7 ngày tới</h3>
      </div>
      
      <div className="flex-1 w-full min-w-0 h-72 flex flex-col justify-center">
        {data && data.length > 0 ? (
          <div className="w-full min-w-0 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 12, fill: '#64748B'}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 12, fill: '#64748B'}} 
                />
                <Tooltip 
                  cursor={{fill: '#F1F5F9'}} 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(value) => [`${value} SP`, 'Nhu cầu dự báo']}
                />
                <Bar 
                  dataKey="value" 
                  fill="#818CF8" 
                  radius={[4, 4, 0, 0]} 
                  barSize={32} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center text-slate-400">
            Chưa có dữ liệu biểu đồ
          </div>
        )}
      </div>
    </div>
  );
}
