import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title = 'Chưa có dữ liệu', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-slate-200 rounded-xl bg-white shadow-sm">
      <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
      {message && <p className="text-slate-500 mb-6 max-w-md">{message}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
