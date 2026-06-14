import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Trash2, RefreshCcw, CheckCircle2, ShoppingCart, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getProducts } from '../services/productService';
import { createOrder, getRecentOrders, createPayosPayment, getOrderPaymentStatus } from '../services/orderService';
import { VALIDATION_ERRORS } from '../constants/errorMessages';
import ErrorText from '../components/ErrorText';

export default function SalesPage({ onNavigate }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    paymentMethod: 'Tiền mặt'
  });

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);

  const [customerGivenAmount, setCustomerGivenAmount] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successOrderData, setSuccessOrderData] = useState(null);
  
  // PayOS states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [payosData, setPayosData] = useState(null);
  
  const pollingIntervalRef = useRef(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    loadProducts();
  }, [search, currentPage]);

  useEffect(() => {
    loadRecentOrders();
    return () => clearPolling(); // cleanup on unmount
  }, []);

  const clearPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadRecentOrders = async () => {
    try {
      const res = await getRecentOrders(5);
      if (res.success) setRecentOrders(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const result = await getProducts({ search, page: currentPage, limit: 10 });
      setProducts(result.data || []);
      if (result.meta?.pagination) {
        setTotalPages(result.meta.pagination.totalPages);
        setTotalItems(result.meta.pagination.total);
      }
    } catch (error) {
      console.error("Failed to load products", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    setErrorMessage('');
    const existing = cart.find(item => item.product_id === product.product_id);
    if (existing) {
      if (existing.quantity + 1 > product.stock_quantity) {
        showToast('Số lượng bán vượt quá tồn kho hiện tại.', 'error');
        return;
      }
      setCart(cart.map(item =>
        item.product_id === product.product_id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      if (product.stock_quantity < 1) {
        showToast('Số lượng bán vượt quá tồn kho hiện tại.', 'error');
        return;
      }
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const handleRemoveFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.selling_price, 0);
  const discount = 0; 
  const total = subtotal - discount;

  const validateOrder = () => {
    setErrorMessage('');
    setFormErrors({});

    if (cart.length === 0) {
      showToast('Vui lòng thêm ít nhất một sản phẩm vào hóa đơn.', 'error');
      return false;
    }

    let hasError = false;
    const newErrors = {};

    if (!customerInfo.name.trim()) {
      newErrors.name = VALIDATION_ERRORS.CUSTOMER_NAME_REQUIRED;
      hasError = true;
    }

    if (customerInfo.phone.trim() && !/^0\d{9}$/.test(customerInfo.phone.trim())) {
      newErrors.phone = VALIDATION_ERRORS.PHONE_INVALID;
      hasError = true;
    }

    if (hasError) {
      setFormErrors(newErrors);
      return false;
    }
    
    return true;
  };

  const handleSubmitOrder = async () => {
    if (!validateOrder()) return;

    if (customerInfo.paymentMethod === 'Chuyển khoản') {
      setShowConfirmModal(true);
      return;
    }

    // Cash flow
    executeOrder();
  };

  const executeOrder = async () => {
    setIsSubmitting(true);
    try {
      const orderData = {
        customer_name: customerInfo.name.trim(),
        customer_phone: customerInfo.phone.trim() || null,
        payment_method: customerInfo.paymentMethod,
        total_amount: total,
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.selling_price
        }))
      };

      const response = await createOrder(orderData);

      if (response.success) {
        const givenAmountNum = parseFloat(customerGivenAmount) || total;
        setSuccessOrderData({
          order_code: response.data.order_code,
          total_amount: total,
          given_amount: givenAmountNum,
          change: givenAmountNum - total
        });
        setShowSuccessModal(true);
        loadRecentOrders();
        loadProducts(); // reload stock
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi tạo hóa đơn.';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmBankTransfer = async () => {
    setIsSubmitting(true);
    setShowConfirmModal(false);

    try {
      const orderData = {
        customer_name: customerInfo.name.trim(),
        customer_phone: customerInfo.phone.trim() || null,
        payment_method: 'Chuyển khoản',
        total_amount: total,
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.selling_price
        }))
      };

      const response = await createPayosPayment(orderData);
      
      if (response.success) {
        setPayosData(response.data);
        setShowQRModal(true);
        showToast('Đã tạo mã QR thanh toán', 'success');
        startPolling(response.data.order_id);
      }
    } catch (error) {
      console.error(error);
      showToast('Không thể tạo mã QR thanh toán. Vui lòng thử lại.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startPolling = (orderId) => {
    clearPolling();
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const res = await getOrderPaymentStatus(orderId);
        if (res.success && res.data.payment_status === 'PAID') {
          clearPolling();
          setShowQRModal(false);
          showToast('Thanh toán thành công. Hóa đơn đã được tạo.', 'success');
          
          setSuccessOrderData({
            order_code: res.data.order_code,
            total_amount: total,
            given_amount: total,
            change: 0
          });
          setShowSuccessModal(true);
          loadRecentOrders();
          loadProducts(); // reload stock
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2500); // 2.5 seconds
  };

  const handleCancelBankTransfer = () => {
    clearPolling();
    setShowQRModal(false);
    setPayosData(null);
  };

  const resetAfterSuccess = () => {
    setShowSuccessModal(false);
    setSuccessOrderData(null);
    setCart([]);
    setCustomerInfo({ name: '', phone: '', paymentMethod: 'Tiền mặt' });
    setCustomerGivenAmount('');
    setErrorMessage('');
    setFormErrors({});
  };

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const isCash = customerInfo.paymentMethod === 'Tiền mặt';
  const givenAmountNum = parseFloat(customerGivenAmount) || 0;
  const isSubmitDisabled = isSubmitting || cart.length === 0 || (isCash && givenAmountNum < total);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 relative">
      {/* Custom Toast */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-[9999] px-6 py-3 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-top-2 fade-in duration-300 ${
          toastMessage.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {toastMessage.text}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bán hàng</h1>
        <p className="text-slate-500 text-sm mt-1">Tạo hóa đơn và tự động cập nhật tồn kho</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h2 className="font-bold text-slate-800 mb-4">Thông tin khách hàng & Sản phẩm</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Tên khách hàng <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Nhập tên khách hàng"
                  className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${formErrors.name ? 'border-red-500' : 'border-slate-200'}`}
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                />
                <ErrorText message={formErrors.name} />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="0900 000 000"
                  className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${formErrors.phone ? 'border-red-500' : 'border-slate-200'}`}
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                />
                <ErrorText message={formErrors.phone} />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Phương thức thanh toán</label>
              <select
                className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white mb-4"
                value={customerInfo.paymentMethod}
                onChange={(e) => setCustomerInfo({ ...customerInfo, paymentMethod: e.target.value })}
              >
                <option>Tiền mặt</option>
                <option>Chuyển khoản</option>
                <option disabled>Thẻ</option>
              </select>

              {isCash && (
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Số tiền khách đưa (VND)</label>
                  <input
                    type="number"
                    placeholder="Nhập số tiền..."
                    className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                    value={customerGivenAmount}
                    onChange={(e) => setCustomerGivenAmount(e.target.value)}
                  />
                  {customerGivenAmount && givenAmountNum < total && (
                    <div className="text-red-500 text-xs mt-1">Khách đưa chưa đủ tiền thanh toán.</div>
                  )}
                  {givenAmountNum >= total && (
                    <div className="text-green-600 text-sm mt-2 font-medium">
                      Tiền thừa trả khách: {formatCurrency(givenAmountNum - total)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 min-h-[400px]">
            <h2 className="font-bold text-slate-800 mb-4">Chọn sản phẩm</h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm sản phẩm..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="text-center text-slate-500 py-4">Đang tải...</div>
              ) : products.length === 0 ? (
                <div className="text-center text-slate-500 py-4">Không tìm thấy sản phẩm</div>
              ) : (
                products.map(product => (
                  <div key={product.product_id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-md"></div>
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">{product.product_name}</div>
                        <div className="text-xs text-slate-500">SKU: {product.sku} | Tồn: <span className={product.stock_quantity > 0 ? "text-green-600" : "text-red-500"}>{product.stock_quantity}</span></div>
                        <div className="font-medium text-blue-600 text-sm mt-0.5">{formatCurrency(product.selling_price)}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock_quantity < 1}
                      className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Thêm
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
                <div className="text-sm text-slate-500 hidden sm:block">
                  Hiển thị <span className="font-medium">{products.length}</span> trên tổng số <span className="font-medium">{totalItems}</span>
                </div>
                <div className="flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-end">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1 px-2">
                    {(() => {
                      let startPage = 1;
                      let endPage = totalPages;
                      if (totalPages > 5) {
                        if (currentPage <= 3) {
                          endPage = 5;
                        } else if (currentPage >= totalPages - 2) {
                          startPage = totalPages - 4;
                        } else {
                          startPage = currentPage - 2;
                          endPage = currentPage + 2;
                        }
                      }
                      const pages = [];
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(i);
                      }
                      return pages.map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                          {page}
                        </button>
                      ));
                    })()}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-[400px]">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
            <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
              <h2 className="font-bold">Hóa đơn</h2>
              <span className="text-sm opacity-80">Mới</span>
            </div>

            <div className="p-4 min-h-[300px] max-h-[400px] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                  <ShoppingCart className="w-12 h-12 mb-2 opacity-20" />
                  <p className="text-sm">Chưa có sản phẩm nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.product_id} className="flex justify-between items-start border-b border-slate-100 pb-3 last:border-0">
                      <div>
                        <div className="font-medium text-slate-800 text-sm">{item.product_name}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          x{item.quantity} × {formatCurrency(item.selling_price)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="font-semibold text-slate-800 text-sm">
                          {formatCurrency(item.quantity * item.selling_price)}
                        </div>
                        <button onClick={() => handleRemoveFromCart(item.product_id)} className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 p-4 space-y-3 bg-slate-50">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Tạm tính</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Giảm giá</span>
                <span>- {formatCurrency(discount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-slate-800 pt-2 border-t border-slate-200">
                <span>Tổng thanh toán</span>
                <span className="text-blue-600">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 space-y-3">
              <div className="flex gap-2 mb-4">
                {['Tiền mặt', 'Chuyển khoản', 'Thẻ'].map(method => (
                  <button
                    key={method}
                    disabled={method === 'Thẻ'}
                    onClick={() => setCustomerInfo({ ...customerInfo, paymentMethod: method })}
                    className={`flex-1 py-1.5 px-2 text-xs rounded-full font-medium transition-colors border ${
                      customerInfo.paymentMethod === method
                        ? 'bg-blue-600 text-white border-blue-600'
                        : method === 'Thẻ' ? 'bg-slate-50 text-slate-400 border-slate-200 opacity-50 cursor-not-allowed'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setCart([]); setCustomerInfo({ name: '', phone: '', paymentMethod: 'Tiền mặt' }); }}
                  className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm flex-1"
                >
                  <RefreshCcw className="w-4 h-4" /> Làm mới
                </button>
                <button
                  onClick={handleSubmitOrder}
                  disabled={isSubmitDisabled}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium text-sm flex-[2]"
                >
                  {isSubmitting ? 'Đang xử lý...' : <><CheckCircle2 className="w-4 h-4" /> Xác nhận</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mt-6">
        <h2 className="font-bold text-slate-800 mb-4">Lịch sử hóa đơn gần đây</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500 font-semibold bg-slate-50">
                <th className="p-3">Mã hóa đơn</th>
                <th className="p-3">Khách hàng</th>
                <th className="p-3">Tổng tiền</th>
                <th className="p-3">Thanh toán</th>
                <th className="p-3">Ngày tạo</th>
                <th className="p-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-slate-500">Chưa có hóa đơn nào được tạo trong phiên này</td>
                </tr>
              ) : (
                recentOrders.map(order => (
                  <tr key={order.order_id} className="hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-800">{order.order_code}</td>
                    <td className="p-3 text-slate-600">{order.customer_name}</td>
                    <td className="p-3 font-medium text-slate-900">{formatCurrency(order.total_amount)}</td>
                    <td className="p-3 text-slate-600">
                      {order.payment_method}
                    </td>
                    <td className="p-3 text-slate-500">{new Date(order.created_at).toLocaleString('vi-VN')}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-green-50 text-green-700 border-green-200">
                        Thành công
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      {showSuccessModal && successOrderData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Thanh toán thành công!</h2>
              <p className="text-slate-500 text-sm mt-1">Mã hóa đơn: {successOrderData.order_code}</p>

              <div className="w-full bg-slate-50 rounded-xl p-4 mt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Tổng thanh toán:</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(successOrderData.total_amount)}</span>
                </div>
                {isCash && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Khách đưa:</span>
                      <span className="font-medium text-slate-800">{formatCurrency(successOrderData.given_amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-3 border-t border-slate-200">
                      <span className="font-medium text-slate-800">Tiền thừa trả khách:</span>
                      <span className="font-bold text-green-600">{formatCurrency(successOrderData.change)}</span>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={resetAfterSuccess}
                className="w-full mt-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM BANK TRANSFER MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-slate-800 text-center mb-4">Xác nhận thanh toán chuyển khoản</h2>
            <p className="text-slate-600 text-sm text-center mb-6">Bạn có chắc chắn muốn tạo mã QR thanh toán cho hóa đơn này không?</p>
            
            <div className="bg-slate-50 p-4 rounded-xl text-sm space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">Khách hàng:</span>
                <span className="font-medium text-slate-800">{customerInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số điện thoại:</span>
                <span className="font-medium text-slate-800">{customerInfo.phone || '---'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số sản phẩm:</span>
                <span className="font-medium text-slate-800">{cart.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tổng thanh toán:</span>
                <span className="font-bold text-blue-600 text-base">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmBankTransfer}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Đang xử lý...' : 'Tạo mã QR'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR MODAL */}
      {showQRModal && payosData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-slate-800 text-center mb-2">Quét mã để thanh toán</h2>
            <div className="flex items-center justify-center gap-2 mb-6 text-blue-600 bg-blue-50 py-2 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
              <span className="text-sm font-medium">Đang chờ thanh toán...</span>
            </div>
            
            <div className="flex justify-center mb-6">
              <div className="p-3 border-2 border-slate-100 rounded-xl bg-white shadow-sm">
                 <QRCodeSVG value={payosData.qr_code} size={220} level={"M"} />
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl text-sm space-y-3 mb-6">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Số tiền:</span>
                <span className="font-bold text-blue-600 text-lg">{formatCurrency(payosData.amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Mã đơn hàng:</span>
                <span className="font-medium text-slate-800">{payosData.order_code}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-slate-500 whitespace-nowrap">Nội dung CK:</span>
                <span className="font-medium text-slate-800 text-right uppercase">{payosData.transfer_content}</span>
              </div>
            </div>

            <button
              onClick={handleCancelBankTransfer}
              className="w-full py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors"
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
