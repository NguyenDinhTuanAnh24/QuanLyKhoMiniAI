import React from 'react';

export default function PageContainer({ children, className = '', 'data-testid': testId = 'page-container', ...rest }) {
  return (
    <div 
      data-testid={testId}
      className={`w-full min-w-0 max-w-full lg:max-w-[1600px] mx-auto space-y-6 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
