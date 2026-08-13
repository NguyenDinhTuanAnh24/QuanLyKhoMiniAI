import React from 'react';
import PageContainer from '../layout/PageContainer';
import { Loader2 } from 'lucide-react';

export default function RouteLoadingFallback() {
  return (
    <PageContainer>
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-sm font-medium">Đang tải giao diện...</span>
        </div>
      </div>
    </PageContainer>
  );
}
