import React, { useState, useEffect } from 'react';
import { Bell, Search, Filter, CheckCheck, RefreshCw, ShoppingBag, CheckCircle2, AlertTriangle, ArrowDownRight, ArrowUpRight, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import { useNotifications } from '../contexts/NotificationContext';
import { useToast } from '../contexts/ToastContext';

export default function Notifications() {
  const navigate = useNavigate();
  const { markAllAsRead, unreadCount } = useNotifications();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, UNREAD, READ
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const fetchHistory = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/notifications?page=${pageNum}&limit=${limit}`);
      if (res.data && res.data.success) {
        setNotifications(res.data.data.items || []);
        setTotalPages(res.data.data.pagination?.totalPages || 1);
        setPage(pageNum);
      }
    } catch (err) {
      console.error('Failed to load notifications history:', err);
      showToast('Lỗi khi tải lịch sử thông báo', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      setNotifications(prev => prev.map(n => (n.id === id || n.recipient_id === id) ? { ...n, is_read: true } : n));
      await api.patch(`/notifications/${id}/read`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAll = async () => {
    await markAllAsRead();
    showToast('Đã đánh dấu tất cả là đã đọc', 'success');
    fetchHistory(page);
  };

  const getNotiStyle = (type, severity) => {
    if (severity === 'CRITICAL') return { bg: 'bg-red-100 text-red-600', icon: <AlertTriangle className="w-5 h-5" /> };
    if (severity === 'WARNING') return { bg: 'bg-amber-100 text-amber-600', icon: <AlertTriangle className="w-5 h-5" /> };
    
    switch (type) {
      case 'SALE_COMPLETED':
      case 'ORDER_NEW':
        return { bg: 'bg-blue-100 text-blue-600', icon: <ShoppingBag className="w-5 h-5" /> };
      case 'PAYMENT_SUCCESS':
        return { bg: 'bg-emerald-100 text-emerald-600', icon: <CheckCircle2 className="w-5 h-5" /> };
      case 'STOCK_LOW':
        return { bg: 'bg-rose-100 text-rose-600', icon: <AlertTriangle className="w-5 h-5" /> };
      case 'STOCK_IMPORTED':
        return { bg: 'bg-blue-100 text-blue-600', icon: <ArrowDownRight className="w-5 h-5" /> };
      case 'STOCK_EXPORTED':
        return { bg: 'bg-blue-100 text-blue-600', icon: <ArrowUpRight className="w-5 h-5" /> };
      default:
        return { bg: 'bg-slate-100 text-slate-600', icon: <Info className="w-5 h-5" /> };
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.is_read;
    if (filter === 'READ') return n.is_read;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Thông báo hệ thống" 
        subtitle="Quản lý lịch sử và các sự kiện quan trọng"
        icon={Bell}
        action={
          <div className="flex gap-2">
            <button
              onClick={() => fetchHistory(page)}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Tải lại
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2 font-medium"
              >
                <CheckCheck className="w-4 h-4" />
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>
        }
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50">
          <div className="flex bg-white rounded-lg border border-slate-200 p-1">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === 'ALL' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilter('UNREAD')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === 'UNREAD' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Chưa đọc
            </button>
            <button
              onClick={() => setFilter('READ')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === 'READ' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Đã đọc
            </button>
          </div>
        </div>

        {/* List */}
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Đang tải dữ liệu...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-slate-400">
              <Bell className="w-12 h-12 text-slate-200 mb-3 stroke-1" />
              <p className="text-lg font-medium text-slate-500">Không có thông báo nào</p>
              <p className="text-sm mt-1">Hệ thống của bạn đang hoạt động ổn định</p>
            </div>
          ) : (
            filteredNotifications.map((noti) => {
              const style = getNotiStyle(noti.type, noti.severity);
              return (
                <div 
                  key={noti.recipient_id || noti.id}
                  className={`p-5 flex items-start gap-4 transition-colors hover:bg-slate-50 ${
                    !noti.is_read ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${style.bg}`}>
                    {style.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className={`text-base ${!noti.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                          {noti.title}
                        </h4>
                        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                          {noti.message}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs font-medium text-slate-400">
                            {new Date(noti.created_at).toLocaleString('vi-VN')}
                          </span>
                          {noti.relatedType && (
                            <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                              {noti.relatedType}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {!noti.is_read ? (
                          <button
                            onClick={() => handleMarkAsRead(noti.recipient_id || noti.id)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            Đánh dấu đã đọc
                          </button>
                        ) : (
                          <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                            <CheckCheck className="w-3.5 h-3.5" />
                            Đã đọc
                          </span>
                        )}
                        
                        {(noti.related_link || noti.type === 'STOCK_LOW') && (
                          <button
                            onClick={() => {
                              if (!noti.is_read) handleMarkAsRead(noti.recipient_id || noti.id);
                              navigate(noti.related_link || '/inventory-alerts');
                            }}
                            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded hover:bg-slate-50 transition-colors"
                          >
                            Xem chi tiết
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex justify-center gap-2 bg-slate-50">
            <button
              disabled={page === 1}
              onClick={() => fetchHistory(page - 1)}
              className="px-3 py-1.5 text-sm font-medium rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-50"
            >
              Trang trước
            </button>
            <span className="px-4 py-1.5 text-sm font-medium text-slate-700">
              {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => fetchHistory(page + 1)}
              className="px-3 py-1.5 text-sm font-medium rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-50"
            >
              Trang sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
