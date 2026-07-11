import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((options) => {
    // support string or object
    const toastConfig = typeof options === 'string' 
      ? { message: options, type: arguments[1] || 'info' }
      : options;

    const id = Date.now().toString() + Math.random().toString();
    setToasts(prev => [...prev, { id, ...toastConfig }]);

    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const handleGlobalToast = (event) => {
      addToast(event.detail);
    };
    window.addEventListener('globalToast', handleGlobalToast);
    return () => window.removeEventListener('globalToast', handleGlobalToast);
  }, [addToast]);

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      default: return null;
    }
  };

  const getBgClass = (type) => {
    switch (type) {
      case 'success': return 'bg-white border-green-200';
      case 'error': return 'bg-white border-red-200';
      case 'warning': return 'bg-white border-amber-200';
      case 'info': return 'bg-white border-blue-200';
      default: return 'bg-white border-slate-200';
    }
  };

  return (
    <ToastContext.Provider value={{ addToast, showToast: addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 w-[360px] p-4 rounded-xl border shadow-lg transform transition-all duration-300 ease-out bg-white`}
            style={{ animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <div className="shrink-0 mt-0.5">
              {getIcon(toast.type)}
            </div>
            <div className="flex-1">
              {toast.title && <h4 className="text-sm font-bold text-slate-900 mb-0.5">{toast.title}</h4>}
              <p className="text-sm font-medium text-slate-800 leading-snug">{toast.message}</p>
            </div>
            <button 
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors -mt-1 -mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}} />
    </ToastContext.Provider>
  );
}
