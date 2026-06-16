import React from 'react';
import StatCard from '../StatCard';
import { PackagePlus, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

export default function AIStatCards({ summary }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard 
        label="Nên nhập thêm" 
        value={summary?.total_suggested_import_products || 0}
        icon={PackagePlus}
        iconColorClass="bg-indigo-50 text-indigo-600"
      />
      <StatCard 
        label="Bán chạy" 
        value={summary?.top_selling_products || 0}
        icon={TrendingUp}
        iconColorClass="bg-green-50 text-green-600"
      />
      <StatCard 
        label="Bán chậm" 
        value={summary?.slow_selling_products || 0}
        icon={TrendingDown}
        iconColorClass="bg-orange-50 text-orange-600"
      />
      <StatCard 
        label="Cảnh báo tồn kho" 
        value={summary?.risk_products || 0}
        icon={AlertTriangle}
        iconColorClass="bg-red-50 text-red-600"
      />
    </div>
  );
}
