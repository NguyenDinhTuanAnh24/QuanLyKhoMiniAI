import React from 'react';

const ConfirmModal = ({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  isDanger = false,
  loading = false,
  type
}) => {
  if (!isOpen) return null;

  const handleClose = () => {
    if (typeof onClose === 'function') return onClose();
    if (typeof onCancel === 'function') return onCancel();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
            {title}
          </h3>
          <p className="text-slate-500 text-center text-sm">
            {message}
          </p>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              if (typeof onConfirm === 'function') onConfirm();
              handleClose();
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${isDanger
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
