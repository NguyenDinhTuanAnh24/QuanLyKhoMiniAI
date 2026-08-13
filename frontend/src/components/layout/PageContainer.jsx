import React from 'react';

export default function PageContainer({ children, className = '' }) {
  return (
    <div 
      data-testid="page-container" 
      className={`w-full min-w-0 max-w-full lg:max-w-[1600px] mx-auto space-y-6 ${className}`}
    >
      {children}
    </div>
  );
}
