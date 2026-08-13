import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Warehouse,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  ShoppingBag,
  Activity,
  Calendar,
  FileText,
  PlusCircle,
  FilePlus,
  Zap,
  TrendingDown,
  Trophy,
  ArrowUpRight
} from 'lucide-react';
import dashboardService from '../services/dashboardService';
import { useToast } from '../contexts/ToastContext';
import { getUser } from '../services/authService';
import LazyRevealSection from '../components/common/LazyRevealSection';
import PageContainer from '../components/layout/PageContainer';
import { Skeleton } from '../components/ui/Skeleton';

const DashboardPage = ({ onNavigate }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const user = getUser();
  const userName = user?.full_name || 'Admin';
  const isStaff = user?.role === 'Nhân viên kho' || user?.role === 'Nhân viên bán hàng';
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchDashboardData();

    // Tự động cập nhật dữ liệu mỗi 60 giây (chỉ khi tab đang hiển thị)
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchDashboardData(true);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      setError(null);
      const overview = await dashboardService.getDashboardOverview();
      setData(overview);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Không thể tải dữ liệu tổng quan. Vui lòng thử lại.');
      showToast('Không thể tải dữ liệu tổng quan. Vui lòng thử lại.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatCurrencyShort = (value) => {
    if (!value) return '0';
    if (value >= 1000000000) return (value / 1000000000).toFixed(1) + 'B';
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return value.toString();
  };

  const todayStr = new Date().toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });

  if (error) {
    return (
      <PageContainer>
        <div className="p-8 text-center text-red-500 mt-20">
          <h2 className="text-2xl font-bold mb-4">Lỗi tải dữ liệu</h2>
          <p>{error}</p>
          <button 
            onClick={() => fetchDashboardData()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </PageContainer>
    );
  }

  // Khai báo an toàn kể cả khi data chưa fetch xong
  const summary = data?.summary || {};
  const revenue_7_days = data?.revenue_7_days || [];
  const top_selling = data?.top_selling || [];
  const low_stock_products = data?.low_stock_products || [];
  const ai_insight = data?.ai_insight || null;
  const recent_activities = data?.recent_activities || [];

  const maxRevenue = revenue_7_days.length > 0 
    ? Math.max(...revenue_7_days.map(d => d.revenue)) 
    : 0;

  // Render
  return (
    <PageContainer>
      {/* Header (Figma style) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Tổng quan hệ thống</h1>
          <p className="text-slate-500 text-sm">Xin chào, {userName}! Đây là tóm tắt hoạt động hôm nay.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm">
          <Calendar size={16} className="text-red-500" />
          {todayStr}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6" data-testid="dashboard-stats">
        
        {/* Doanh thu hôm nay */}
        {!isStaff && (
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-3 min-h-[116px]">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                <DollarSign size={20} />
              </div>
              {loading ? (
                <Skeleton className="w-12 h-6 rounded-md" />
              ) : (
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">+0%</span>
              )}
            </div>
            <div>
              {loading ? (
                <>
                  <Skeleton className="w-24 h-8 mb-1" />
                  <Skeleton className="w-32 h-4" />
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-slate-800">₫ {formatCurrencyShort(summary.today_revenue)}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">Doanh thu hôm nay</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Đơn hàng hôm nay */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-3 min-h-[116px]">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500">
              <ShoppingBag size={20} />
            </div>
            {loading ? (
              <Skeleton className="w-12 h-6 rounded-md" />
            ) : (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">+{summary.today_orders || 0} đơn</span>
            )}
          </div>
          <div>
            {loading ? (
              <>
                <Skeleton className="w-16 h-8 mb-1" />
                <Skeleton className="w-32 h-4" />
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-slate-800">{summary.today_orders || 0}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Đơn hàng hôm nay</p>
              </>
            )}
          </div>
        </div>

        {/* Sản phẩm sắp hết */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-3 min-h-[116px]">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-500">
              <AlertTriangle size={20} />
            </div>
            {loading ? (
              <Skeleton className="w-12 h-6 rounded-md" />
            ) : (
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-md">Cần nhập</span>
            )}
          </div>
          <div>
            {loading ? (
              <>
                <Skeleton className="w-16 h-8 mb-1" />
                <Skeleton className="w-32 h-4" />
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-slate-800">{summary.low_stock_count || 0}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Sản phẩm sắp hết</p>
              </>
            )}
          </div>
        </div>

        {/* Giá trị tồn kho */}
        {!isStaff && (
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-3 min-h-[116px]">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                <Warehouse size={20} />
              </div>
              {loading ? (
                <Skeleton className="w-12 h-6 rounded-md" />
              ) : (
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">+0%</span>
              )}
            </div>
            <div>
              {loading ? (
                <>
                  <Skeleton className="w-24 h-8 mb-1" />
                  <Skeleton className="w-32 h-4" />
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-slate-800">₫ {formatCurrencyShort(summary.inventory_value)}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">Giá trị tồn kho</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Row 2: Chart & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6" data-testid="dashboard-main-grid">
        
        {/* Doanh thu 7 ngày gần nhất (span 2) */}
        {!isStaff && (
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex flex-col min-h-[350px]">
            <div className="mb-6">
              <h3 className="text-base font-bold text-slate-800">Doanh thu 7 ngày gần nhất</h3>
              <p className="text-xs text-slate-500 mt-1">Cập nhật đến hôm nay</p>
            </div>
            
            <div className="flex-1 flex items-end gap-4 relative pt-8">
              {loading ? (
                <div className="absolute inset-0 flex items-end justify-around pb-6 pl-8">
                  <Skeleton className="w-[8%] h-[30%] rounded-t-sm" />
                  <Skeleton className="w-[8%] h-[50%] rounded-t-sm" />
                  <Skeleton className="w-[8%] h-[40%] rounded-t-sm" />
                  <Skeleton className="w-[8%] h-[70%] rounded-t-sm" />
                  <Skeleton className="w-[8%] h-[90%] rounded-t-sm" />
                  <Skeleton className="w-[8%] h-[60%] rounded-t-sm" />
                  <Skeleton className="w-[8%] h-[80%] rounded-t-sm" />
                </div>
              ) : (
                <>
                  {/* Y-axis simple guides */}
                  <div className="absolute inset-0 flex flex-col justify-between text-[10px] font-medium text-slate-400 pb-6 pointer-events-none">
                    <div className="border-b border-slate-100 w-full h-0 flex items-end justify-start">
                      <span className="-translate-y-2 bg-white pr-2">{formatCurrencyShort(maxRevenue)}</span>
                    </div>
                    <div className="border-b border-slate-100 w-full h-0 flex items-end justify-start">
                      <span className="-translate-y-2 bg-white pr-2">{formatCurrencyShort(maxRevenue / 2)}</span>
                    </div>
                    <div className="border-b border-slate-200 w-full h-0 flex items-end justify-start">
                      <span className="-translate-y-2 bg-white pr-2">0</span>
                    </div>
                  </div>

                  {/* Bars */}
                  <div className="w-full flex justify-around items-end h-full pl-8 pb-6 z-10">
                    {revenue_7_days.map((item, index) => {
                      const heightPercentage = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                      return (
                        <div key={index} className="flex flex-col items-center group w-full px-2 relative h-full justify-end">
                          {item.revenue > 0 && (
                            <span className="text-[10px] font-bold text-blue-600 mb-1 absolute" style={{ bottom: `${heightPercentage}%` }}>
                              {formatCurrencyShort(item.revenue)}
                            </span>
                          )}
                          <div 
                            className="w-full max-w-[40px] bg-blue-500 hover:bg-blue-600 rounded-t transition-all duration-300 min-h-[4px]"
                            style={{ height: `${heightPercentage}%` }}
                          ></div>
                          <div className="absolute -bottom-5 text-xs font-medium text-slate-500 whitespace-nowrap">
                            {item.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* AI Insights hôm nay */}
        <div className={`${isStaff ? 'lg:col-span-3' : ''} bg-[#f8faff] rounded-xl border border-blue-100 shadow-sm p-6 flex flex-col min-h-[350px]`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="text-blue-600" size={18} />
              AI Insights hôm nay
            </h3>
            <span className="text-xs text-slate-400 font-medium">08:00 SA</span>
          </div>

          <div className="flex-1 space-y-4">
            {loading ? (
              <>
                <Skeleton className="w-full h-[60px] rounded-lg" />
                <Skeleton className="w-full h-[60px] rounded-lg" />
                <Skeleton className="w-full h-[60px] rounded-lg" />
              </>
            ) : (
              <>
                <div className="flex items-start gap-3 bg-white p-3 rounded-lg border border-blue-50">
                  <ArrowUpRight className="text-blue-500 mt-0.5" size={16} />
                  <p className="text-sm text-slate-700">{ai_insight?.message || "Đang phân tích dữ liệu kho..."}</p>
                </div>
                
                {ai_insight?.suggestions?.slice(0, 2).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-white p-3 rounded-lg border border-blue-50">
                    <Trophy className="text-orange-500 mt-0.5" size={16} />
                    <p className="text-sm text-slate-700">Nên nhập thêm <span className="font-bold">{item.suggested_import_quantity} {item.unit_name}</span> {item.product_name}</p>
                  </div>
                ))}

                {summary?.low_stock_count > 0 && (
                  <div className="flex items-start gap-3 bg-white p-3 rounded-lg border border-red-50">
                    <AlertTriangle className="text-red-500 mt-0.5" size={16} />
                    <p className="text-sm text-slate-700"><span className="font-bold text-red-600">{summary.low_stock_count} sản phẩm</span> sắp hết hàng, cần xử lý ngay</p>
                  </div>
                )}
              </>
            )}
          </div>

          {!isStaff && (
            <button 
              onClick={() => onNavigate ? onNavigate('ai-insights') : navigate('/ai-insights')}
              disabled={loading}
              className="w-full mt-6 py-2.5 bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 font-medium rounded-lg transition-colors flex justify-center items-center gap-2 text-sm disabled:opacity-50"
            >
              <Sparkles size={14} /> Xem phân tích đầy đủ <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Row 3: Giao dịch gần đây & Cảnh báo tồn kho */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Giao dịch gần đây (span 2) */}
        <LazyRevealSection minHeight={300} className="lg:col-span-2">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-0 overflow-hidden flex flex-col h-full min-h-[300px]">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-800">Giao dịch gần đây</h3>
            <button 
              onClick={() => onNavigate ? onNavigate('sales') : navigate('/sales')}
              className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1"
            >
              Xem tất cả <ArrowRight size={12} />
            </button>
          </div>
          
          <div className="overflow-x-auto flex-1 p-5">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="w-full h-8" />
                <Skeleton className="w-full h-8" />
                <Skeleton className="w-full h-8" />
                <Skeleton className="w-full h-8" />
              </div>
            ) : (!recent_activities || recent_activities.length === 0) ? (
              <div className="text-center py-8 text-slate-500 italic text-sm">Chưa có giao dịch gần đây</div>
            ) : (
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="text-xs text-slate-400 bg-slate-50 uppercase font-medium">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Mã HD</th>
                    <th className="px-4 py-3">Loại</th>
                    <th className="px-4 py-3">Chi tiết</th>
                    <th className="px-4 py-3">Thời gian</th>
                    <th className="px-4 py-3 text-right rounded-r-lg">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_activities.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-700">{item.id.substring(0, 8)}...</td>
                      <td className="px-4 py-3">{item.title}</td>
                      <td className="px-4 py-3">{item.description}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{new Date(item.created_at).toLocaleString('vi-VN')}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-medium ${item.type === 'ORDER' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                          Hoàn thành
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        </LazyRevealSection>

        {/* Cảnh báo tồn kho */}
        <LazyRevealSection minHeight={300} className="h-full">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col h-full min-h-[300px]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Cảnh báo tồn kho</h3>
              <p className="text-xs text-slate-500 mt-0.5">{loading ? <Skeleton className="w-24 h-3 inline-block" /> : `${summary.low_stock_count || 0} sản phẩm cần chú ý`}</p>
            </div>
            <button 
              onClick={() => onNavigate ? onNavigate('alerts') : navigate('/alerts')}
              className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1"
            >
              Xem tất cả <ArrowRight size={12} />
            </button>
          </div>

          <div className="flex-1 space-y-4 mt-2">
            {loading ? (
              <>
                <Skeleton className="w-full h-12" />
                <Skeleton className="w-full h-12" />
                <Skeleton className="w-full h-12" />
              </>
            ) : (!low_stock_products || low_stock_products.length === 0) ? (
              <div className="text-center py-8 text-slate-500 italic text-sm">Không có sản phẩm sắp hết</div>
            ) : (
              low_stock_products.map((item, idx) => {
                const percent = Math.min((item.stock_quantity / item.reorder_level) * 100, 100);
                const isOutOfStock = item.stock_quantity <= 0;
                
                return (
                  <div key={idx} className="flex flex-col gap-2 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-red-500' : 'bg-orange-400'}`}></div>
                        <p className="text-sm font-semibold text-slate-800 truncate max-w-[150px]">{item.product_name}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded text-red-600 font-medium ${isOutOfStock ? 'bg-red-50' : 'bg-orange-50 text-orange-600'}`}>
                        {item.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1.5">Tồn: {item.stock_quantity} / Tối thiểu: {item.reorder_level}</p>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${isOutOfStock ? 'bg-red-500' : 'bg-orange-400'}`} style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button 
            onClick={() => onNavigate ? onNavigate('import') : navigate('/inventory-ops')}
            disabled={loading}
            className="w-full mt-4 py-2.5 bg-blue-500 text-white hover:bg-blue-600 font-medium rounded-lg transition-colors flex justify-center items-center text-sm disabled:opacity-50"
          >
            + Tạo phiếu nhập hàng nhanh
          </button>
        </div>
        </LazyRevealSection>
      </div>

      {/* Row 4: Sản phẩm bán chạy hôm nay & Thao tác nhanh */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sản phẩm bán chạy hôm nay (span 2) */}
        {!isStaff && (
          <LazyRevealSection minHeight={300} className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 h-full min-h-[300px]">
            <h3 className="text-base font-bold text-slate-800 mb-6">Sản phẩm bán chạy hôm nay</h3>
            
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="w-full h-10" />
                <Skeleton className="w-full h-10" />
                <Skeleton className="w-full h-10" />
              </div>
            ) : (!top_selling || top_selling.length === 0) ? (
              <div className="text-center py-8 text-slate-500 italic text-sm">Chưa có dữ liệu bán hàng</div>
            ) : (
              <div className="space-y-4">
                {top_selling.map((item, idx) => {
                  const maxSold = top_selling[0]?.quantity_sold || 1;
                  const barWidth = (item.quantity_sold / maxSold) * 100;
                  
                  return (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-6 text-center font-bold text-slate-400">{idx + 1}</div>
                      
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800">{item.product_name}</p>
                        <p className="text-xs text-slate-500">{item.quantity_sold} đã bán</p>
                      </div>

                      <div className="hidden sm:block w-32 md:w-48">
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-blue-300" style={{ width: `${barWidth}%` }}></div>
                        </div>
                      </div>

                      <div className="w-24 text-right">
                        <p className="text-sm font-bold text-slate-800">₫ {formatCurrencyShort(item.revenue)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          </LazyRevealSection>
        )}

        {/* Thao tác nhanh */}
        <LazyRevealSection minHeight={300} className={`${isStaff ? 'lg:col-span-3' : 'h-full'}`}>
        <div className={`h-full grid ${isStaff ? 'grid-cols-1 md:grid-cols-3 gap-4' : 'grid-cols-1'} bg-white rounded-xl border border-slate-100 shadow-sm p-6 min-h-[300px]`}>
          <h3 className={`text-base font-bold text-slate-800 mb-4 ${isStaff ? 'col-span-full' : ''}`}>Thao tác nhanh</h3>
          
          <div className={`${isStaff ? 'contents' : 'space-y-3'}`}>
            <button 
              onClick={() => onNavigate ? onNavigate('sales') : navigate('/sales')}
              disabled={loading}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors group disabled:opacity-50 disabled:pointer-events-none"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-50 text-blue-500 rounded-md group-hover:bg-blue-100">
                  <PlusCircle size={16} />
                </div>
                <span className="text-sm font-medium text-slate-700">Tạo hóa đơn bán hàng</span>
              </div>
              <ArrowRight size={14} className="text-slate-400 group-hover:text-blue-500" />
            </button>

            <button 
              onClick={() => onNavigate ? onNavigate('import') : navigate('/inventory-ops')}
              disabled={loading}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-colors group disabled:opacity-50 disabled:pointer-events-none"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-emerald-50 text-emerald-500 rounded-md group-hover:bg-emerald-100">
                  <ArrowDownCircle size={16} />
                </div>
                <span className="text-sm font-medium text-slate-700">Tạo phiếu nhập kho</span>
              </div>
              <ArrowRight size={14} className="text-slate-400 group-hover:text-emerald-500" />
            </button>

            <button 
              onClick={() => onNavigate ? onNavigate('products') : navigate('/products')}
              disabled={loading}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors group disabled:opacity-50 disabled:pointer-events-none"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-50 text-blue-500 rounded-md group-hover:bg-blue-100">
                  <Package size={16} />
                </div>
                <span className="text-sm font-medium text-slate-700">Thêm sản phẩm mới</span>
              </div>
              <ArrowRight size={14} className="text-slate-400 group-hover:text-blue-500" />
            </button>

            {!isStaff && (
              <button 
                onClick={() => onNavigate ? onNavigate('ai-insights') : navigate('/ai-insights')}
                disabled={loading}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-orange-200 hover:bg-orange-50/50 transition-colors group disabled:opacity-50 disabled:pointer-events-none"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-orange-50 text-orange-500 rounded-md group-hover:bg-orange-100">
                    <Sparkles size={16} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Chạy phân tích AI ngay</span>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:text-orange-500" />
              </button>
            )}
          </div>
        </div>
        </LazyRevealSection>
        
      </div>
    </PageContainer>
  );
};

// Missing icon fallback for ArrowDownCircle
const ArrowDownCircle = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="8 12 12 16 16 12"></polyline>
    <line x1="12" y1="8" x2="12" y2="16"></line>
  </svg>
);

export default DashboardPage;
