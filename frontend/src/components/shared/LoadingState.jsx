import React from 'react';

export default function LoadingState({ message = 'Đang tải dữ liệu...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-500">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      <p>{message}</p>
    </div>
  );
}
