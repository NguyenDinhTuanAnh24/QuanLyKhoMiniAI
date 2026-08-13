import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, RefreshCcw, CheckCircle2, ShoppingCart, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertTriangle, X, Lightbulb, Minus } from 'lucide-react';
import { getProducts } from '../services/productService';
import ConfirmModal from '../components/ConfirmModal';
import PageContainer from '../components/layout/PageContainer';
import { getCategories } from '../services/categoryService';
import { createOrder, getRecentOrders, createPayosPayment, getOrderPaymentStatus } from '../services/orderService';
import { QRCodeSVG } from 'qrcode.react';
import { VALIDATION_ERRORS } from '../constants/errorMessages';
import ErrorText from '../components/ErrorText';
import { useToast } from '../contexts/ToastContext';

const BANK_ID = "MB";
const ACCOUNT_NO = "0967733713";
const ACCOUNT_NAME = "DINH HA NAM";
const TEMPLATE = "compact2";

const normalizeTransferText = (text) => {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

export default function SalesPage({ onNavigate }) {
  const { showToast } = useToast();

  const [cart, setCart] = useState([]);

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
  
  // Order History Pagination
  const [orderPage, setOrderPage] = useState(1);
  const ordersPerPage = 5;

  const [customerGivenAmount, setCustomerGivenAmount] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successOrderData, setSuccessOrderData] = useState(null);
  
  // New Confirm Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  
  const [showQRModal, setShowQRModal] = useState(false);
  const [payosData, setPayosData] = useState(null);
  
  const [pendingOrderCode, setPendingOrderCode] = useState(null);
  const [transferContent, setTransferContent] = useState("");
  
  // Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modalSearch, setModalSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('name-asc');
  const [modalPage, setModalPage] = useState(1);

  useEffect(() => {
    loadAllProductsAndCategories();
    loadRecentOrders();
  }, []);

  const loadAllProductsAndCategories = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        getProducts({ limit: 1000 }),
        getCategories()
      ]);
      if (prodRes.success) setAllProducts(prodRes.data);
      if (catRes.success) setCategories(catRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredProducts = () => {
    let result = [...allProducts];

    if (modalSearch.trim()) {
      const q = modalSearch.toLowerCase();
      result = result.filter(p => 
        p.product_name.toLowerCase().includes(q) || 
        p.sku.toLowerCase().includes(q)
      );
    }

    if (categoryFilter) {
      result = result.filter(p => p.category_name === categoryFilter);
    }

    if (stockFilter) {
      if (stockFilter === 'in-stock') {
        result = result.filter(p => p.stock_quantity > p.reorder_level);
      } else if (stockFilter === 'low-stock') {
        result = result.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.reorder_level);
      } else if (stockFilter === 'out-of-stock') {
        result = result.filter(p => p.stock_quantity <= 0);
      }
    }

    if (sortOrder) {
      if (sortOrder === 'name-asc') result.sort((a, b) => a.product_name.localeCompare(b.product_name));
      if (sortOrder === 'price-asc') result.sort((a, b) => a.selling_price - b.selling_price);
      if (sortOrder === 'price-desc') result.sort((a, b) => b.selling_price - a.selling_price);
      if (sortOrder === 'stock-asc') result.sort((a, b) => a.stock_quantity - b.stock_quantity);
      if (sortOrder === 'stock-desc') result.sort((a, b) => b.stock_quantity - a.stock_quantity);
    }

    return result;
  };

  const filteredProducts = getFilteredProducts();
  const modalTotalPages = Math.ceil(filteredProducts.length / 8) || 1;
  const paginatedProducts = filteredProducts.slice((modalPage - 1) * 8, modalPage * 8);

  const loadRecentOrders = async () => {
    try {
      const res = await getRecentOrders(1000);
      if (res.success) setRecentOrders(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const sortedOrders = [...recentOrders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const orderTotalPages = Math.ceil(sortedOrders.length / ordersPerPage) || 1;
  const paginatedOrders = sortedOrders.slice((orderPage - 1) * ordersPerPage, orderPage * ordersPerPage);

  const handleAddToCart = (product) => {
    setErrorMessage('');
    const existing = cart.find(item => item.product_id === product.product_id);
    if (existing) {
      if (existing.quantity + 1 > product.stock_quantity) {
        showToast({ type: 'error', title: 'Lỗi', message: 'Số lượng bán vượt quá tồn kho hiện tại.' });
        return;
      }
      setCart(cart.map(item =>
        item.product_id === product.product_id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
      showToast({ type: 'success', title: 'Thành công', message: `Đã cập nhật số lượng ${product.product_name} trong hóa đơn` });
    } else {
      if (product.stock_quantity < 1) {
        showToast({ type: 'error', title: 'Lỗi', message: 'Sản phẩm đã hết hàng, không thể thêm vào hóa đơn' });
        return;
      }
      setCart([...cart, { ...product, quantity: 1 }]);
      showToast({ type: 'success', title: 'Thành công', message: `Đã thêm ${product.product_name} vào hóa đơn` });
    }
  };

  const handleRemoveFromCart = (productId) => {
    const item = cart.find(i => i.product_id === productId);
    setCart(cart.filter(i => i.product_id !== productId));
    if (item) {
      showToast({ type: 'success', title: 'Thành công', message: `Đã xóa ${item.product_name} khỏi hóa đơn` });
    }
  };

  const handleIncreaseQuantity = (product) => {
    handleAddToCart(product);
  };

  const handleDecreaseQuantity = (productId) => {
    const existing = cart.find(item => item.product_id === productId);
    if (existing && existing.quantity > 1) {
      setCart(cart.map(item =>
        item.product_id === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ));
    } else if (existing && existing.quantity === 1) {
      handleRemoveFromCart(productId);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.selling_price, 0);
  const discount = 0; // Fixed for now
  const total = subtotal - discount;

  const handleSubmitOrder = async () => {
    setErrorMessage('');
    setFormErrors({});

    if (cart.length === 0) {
      showToast({ type: 'warning', title: 'Cảnh báo', message: 'Vui lòng thêm ít nhất một sản phẩm vào hóa đơn.' });
      return;
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
    
    if (customerInfo.paymentMethod === 'Tiền mặt') {
      const givenAmountNum = parseFloat(customerGivenAmount) || 0;
      if (customerGivenAmount && givenAmountNum < total) {
        showToast({ type: 'warning', title: 'Cảnh báo', message: 'Số tiền khách đưa chưa đủ để thanh toán.' });
        hasError = true;
      }
    }

    if (hasError) {
      setFormErrors(newErrors);
      showToast({ type: 'warning', title: 'Cảnh báo', message: 'Vui lòng kiểm tra lại thông tin hóa đơn.' });
      return;
    }

    // Nếu hợp lệ, mở popup xác nhận
    setShowConfirmModal(true);
  };

  const startPolling = (orderId) => {
    const interval = setInterval(async () => {
      try {
        const res = await getOrderPaymentStatus(orderId);
        if (res.success && res.data.payment_status === 'PAID') {
          clearInterval(interval);
          setShowQRModal(false);
          setSuccessOrderData({
            order_code: res.data.order_code,
            total_amount: total,
            given_amount: total,
            change: 0
          });
          setShowSuccessModal(true);
          setOrderPage(1);
          loadRecentOrders();
          loadAllProductsAndCategories();
        }
      } catch (e) {
        console.error(e);
      }
    }, 3000);
  };

  const handleConfirmAction = async () => {
    setShowConfirmModal(false);
    if (customerInfo.paymentMethod === 'Chuyển khoản') {
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

        const response = await createPayosPayment(orderData);
        
        if (response.success) {
          setPayosData(response.data);
          setShowQRModal(true);
          showToast({ type: 'success', title: 'Thành công', message: 'Đã tạo mã QR thanh toán' });
          startPolling(response.data.order_id);
        }
      } catch (error) {
        console.error(error);
        showToast({ type: 'error', title: 'Lỗi', message: 'Không thể tạo mã thanh toán.' });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    executeOrder();
  };

  const executeOrder = async () => {
    setIsSubmitting(true);
    setShowQRModal(false);
    try {
      const orderData = {
        order_code: pendingOrderCode || undefined,
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
        showToast({ 
          type: 'success', 
          title: 'Thành công', 
          message: customerInfo.paymentMethod === 'Chuyển khoản' ? 'Thanh toán chuyển khoản thành công' : 'Thanh toán thành công' 
        });
        setShowSuccessModal(true);
        setOrderPage(1);
        loadRecentOrders();
        loadAllProductsAndCategories(); // reload stock
      }
    } catch (error) {
      console.error(error);
      showToast({ type: 'error', title: 'Lỗi', message: 'Không thể thanh toán. Vui lòng thử lại.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAfterSuccess = () => {
    setShowSuccessModal(false);
    setSuccessOrderData(null);
    setCart([]);
    setCustomerInfo({ name: '', phone: '', paymentMethod: 'Tiền mặt' });
    setCustomerGivenAmount('');
    setErrorMessage('');
    setFormErrors({});
    setPendingOrderCode(null);
    setTransferContent("");
    setPayosData(null);
  };

  const handleResetCart = () => {
    setCart([]);
    setCustomerInfo({ name: '', phone: '', paymentMethod: 'Tiền mặt' });
    setCustomerGivenAmount('');
    setPendingOrderCode(null);
    setTransferContent("");
    showToast({ type: 'success', title: 'Thành công', message: 'Đã làm mới hóa đơn' });
  };

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const isCash = customerInfo.paymentMethod === 'Tiền mặt';
  const givenAmountNum = parseFloat(customerGivenAmount) || 0;
  const isSubmitDisabled = isSubmitting || cart.length === 0 || (isCash && givenAmountNum < total);

  return (
    <PageContainer>
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
                <option value="Tiền mặt">Tiền mặt</option>
                <option value="Chuyển khoản">Chuyển khoản</option>
                <option value="Thẻ" disabled>Thẻ (Đang phát triển)</option>
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

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-slate-800">Sản phẩm trong hóa đơn</h2>
              <button 
                onClick={() => {
                  setModalPage(1);
                  setShowProductModal(true);
                }}
                className="flex items-center gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" /> Chọn sản phẩm
              </button>
            </div>
            
            {cart.length === 0 ? (
              <div className="text-center text-slate-500 py-10 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center">
                <ShoppingCart className="w-10 h-10 text-slate-300 mb-3" />
                <p className="font-medium text-slate-600">Chưa có sản phẩm nào</p>
                <p className="text-sm mt-1">Bấm "Chọn sản phẩm" để thêm vào hóa đơn</p>
                <button 
                  onClick={() => setShowProductModal(true)}
                  className="mt-4 flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" /> Mở danh sách
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.slice(0, 3).map(item => (
                  <div key={item.product_id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="font-medium text-sm text-slate-800 truncate pr-2 flex-1">{item.product_name}</div>
                    <div className="text-sm text-slate-600">SL: {item.quantity}</div>
                  </div>
                ))}
                {cart.length > 3 && (
                  <div className="text-center text-sm text-slate-500 pt-2 border-t border-slate-100">
                    Và {cart.length - 3} sản phẩm khác...
                  </div>
                )}
                <div className="text-center text-sm font-medium text-blue-600 pt-2">
                  Tổng {cart.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm đang được chọn
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-[400px]">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
            <div className="p-4 flex justify-between items-center border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Hóa đơn</h3>
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-medium border border-blue-100">Mới</span>
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
                    <div key={item.product_id} className="border-b border-slate-100 pb-3 last:border-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-slate-800 text-sm truncate pr-2">{item.product_name}</div>
                        <div className="font-bold text-slate-800 text-sm whitespace-nowrap">
                          {formatCurrency(item.quantity * item.selling_price)}
                        </div>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <div className="text-xs text-slate-500">Đơn giá: {formatCurrency(item.selling_price)}</div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleDecreaseQuantity(item.product_id)} className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                            <button onClick={() => handleIncreaseQuantity(item)} className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <button onClick={() => handleRemoveFromCart(item.product_id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
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
                {['Tiền mặt', 'Chuyển khoản', 'Thẻ'].map(method => {
                  const isDisabled = method === 'Thẻ';
                  return (
                    <button
                      key={method}
                      onClick={() => !isDisabled && setCustomerInfo({ ...customerInfo, paymentMethod: method })}
                      disabled={isDisabled}
                      title={isDisabled ? "Chức năng đang phát triển" : ""}
                      className={`flex-1 py-1.5 px-2 text-xs rounded-full font-medium transition-colors border ${isDisabled ? 'bg-slate-50 text-slate-400 border-slate-200 opacity-60 cursor-not-allowed' : (customerInfo.paymentMethod === method
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50')
                        }`}
                    >
                      {method}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleResetCart}
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
        <div className="hidden md:block overflow-x-auto">
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
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-slate-500">Chưa có hóa đơn nào</td>
                </tr>
              ) : (
                paginatedOrders.map(order => (
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

        {/* Mobile View */}
        <div className="md:hidden flex flex-col divide-y divide-slate-100">
          {paginatedOrders.length === 0 ? (
            <div className="p-6 text-center text-slate-500">Chưa có hóa đơn nào</div>
          ) : (
            paginatedOrders.map(order => (
              <div key={order.order_id} className="py-4 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-slate-800">{order.order_code}</div>
                    <div className="text-sm text-slate-600">{order.customer_name}</div>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-green-50 text-green-700 border-green-200">
                    Thành công
                  </span>
                </div>
                <div className="flex justify-between items-end mt-1 text-sm">
                  <div className="text-slate-500 flex flex-col">
                    <span>{new Date(order.created_at).toLocaleString('vi-VN')}</span>
                    <span>{order.payment_method}</span>
                  </div>
                  <div className="font-bold text-slate-900">{formatCurrency(order.total_amount)}</div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Pagination Controls */}
        {sortedOrders.length > 0 && (
          <div className="flex items-center justify-between mt-4 px-2">
            <div className="text-sm text-slate-500">
              Hiển thị {(orderPage - 1) * ordersPerPage + 1} - {Math.min(orderPage * ordersPerPage, sortedOrders.length)} trong tổng số {sortedOrders.length} hóa đơn
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOrderPage(p => Math.max(1, p - 1))}
                disabled={orderPage === 1}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                Trước
              </button>
              <div className="text-sm font-medium text-slate-700 px-2">
                Trang {orderPage} / {orderTotalPages}
              </div>
              <button
                onClick={() => setOrderPage(p => Math.min(orderTotalPages, p + 1))}
                disabled={orderPage === orderTotalPages}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

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
      
      {/* Payment Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-full">
            <div className="p-6 overflow-y-auto">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4 mx-auto shrink-0">
                {customerInfo.paymentMethod === 'Chuyển khoản' ? <CheckCircle2 className="w-6 h-6 text-blue-600" /> : <Lightbulb className="w-6 h-6 text-blue-600" />}
              </div>
              <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
                {customerInfo.paymentMethod === 'Chuyển khoản' ? 'Xác nhận tạo mã QR' : 'Xác nhận thanh toán'}
              </h3>
              
              <p className="text-slate-500 text-center text-sm mb-6">
                {customerInfo.paymentMethod === 'Chuyển khoản' 
                  ? 'Bạn có chắc chắn muốn tạo mã QR thanh toán cho hóa đơn này không?' 
                  : 'Bạn có chắc chắn muốn hoàn tất hóa đơn này không?'}
              </p>
              
              <div className="bg-slate-50 p-4 rounded-lg space-y-2 border border-slate-100 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Khách hàng:</span>
                  <span className="font-medium text-slate-900">{customerInfo.name || 'Khách lẻ'}</span>
                </div>
                {customerInfo.phone && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số điện thoại:</span>
                    <span className="font-medium text-slate-900">{customerInfo.phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Phương thức:</span>
                  <span className="font-medium text-slate-900">{customerInfo.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Số sản phẩm:</span>
                  <span className="font-medium text-slate-900">{cart.reduce((a, b) => a + b.quantity, 0)}</span>
                </div>
                {customerInfo.paymentMethod === 'Tiền mặt' && discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Giảm giá:</span>
                    <span className="font-medium text-slate-900">- {formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                  <span className="text-slate-500">Tổng thanh toán:</span>
                  <span className="font-bold text-blue-600">{formatCurrency(total)}</span>
                </div>
                
                {customerInfo.paymentMethod === 'Tiền mặt' && customerGivenAmount && (
                  <>
                    <div className="flex justify-between mt-1">
                      <span className="text-slate-500">Khách đưa:</span>
                      <span className="font-medium text-slate-900">{formatCurrency(parseFloat(customerGivenAmount))}</span>
                    </div>
                    {parseFloat(customerGivenAmount) >= total && (
                      <div className="flex justify-between mt-1">
                        <span className="text-slate-500">Tiền thừa:</span>
                        <span className="font-bold text-green-600">{formatCurrency(parseFloat(customerGivenAmount) - total)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={() => setShowConfirmModal(false)} 
                className="px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg font-medium transition-colors"
              >
                Hủy
              </button>
              <button 
                type="button" 
                onClick={handleConfirmAction} 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {customerInfo.paymentMethod === 'Chuyển khoản' ? 'Tạo mã QR' : 'Xác nhận thanh toán'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showQRModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Quét mã để thanh toán</h2>
              <button onClick={() => setShowQRModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="flex justify-center mb-6 bg-slate-50 rounded-xl py-6 border border-slate-100">
                {payosData ? (
                  <div className="flex flex-col items-center">
                    <QRCodeSVG value={payosData.qr_code} size={256} className="bg-white p-2 rounded-xl shadow-sm border border-slate-200" />
                    <p className="text-slate-500 text-sm mt-4 text-center">Quét mã bằng ứng dụng ngân hàng</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500 text-center px-4 w-56 h-56 bg-white rounded-xl shadow-sm border border-slate-200">
                    <span className="text-sm">Đang tạo mã QR...</span>
                  </div>
                )}
              </div>
              
              {payosData && (
                <div className="bg-slate-50 border border-slate-100 p-5 rounded-xl text-sm space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số tiền:</span>
                    <span className="font-bold text-blue-600 text-lg leading-none">{formatCurrency(payosData.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ngân hàng:</span>
                    <span className="font-medium text-slate-800">{BANK_ID}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số tài khoản:</span>
                    <span className="font-medium text-slate-800">{ACCOUNT_NO}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Chủ tài khoản:</span>
                    <span className="font-medium text-slate-800 uppercase">{ACCOUNT_NAME}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-3 mt-3">
                    <span className="text-slate-500">Mã đơn hàng:</span>
                    <span className="font-medium text-slate-800">{payosData.order_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nội dung:</span>
                    <span className="font-medium text-slate-800">{payosData.transfer_content}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="pt-2">
              <button
                onClick={() => setShowCancelConfirmModal(true)}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showCancelConfirmModal}
        onClose={() => setShowCancelConfirmModal(false)}
        onConfirm={() => {
          setShowQRModal(false);
          setShowCancelConfirmModal(false);
        }}
        title="Xác nhận hủy thanh toán"
        message="Bạn có chắc chắn muốn hủy thanh toán qua mã QR? Đơn hàng sẽ không được hoàn tất."
        confirmText="Hủy thanh toán"
        cancelText="Đóng"
        isDanger={true}
      />

      {/* Product Selection Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" /> Chọn sản phẩm vào hóa đơn
              </h2>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-200 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 border-b border-slate-100 bg-white grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tìm Tên, SKU..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                  value={modalSearch}
                  onChange={(e) => { setModalSearch(e.target.value); setModalPage(1); }}
                />
              </div>
              <select
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setModalPage(1); }}
              >
                <option value="">Tất cả danh mục</option>
                {categories.map(c => (
                  <option key={c.category_id} value={c.category_name}>{c.category_name}</option>
                ))}
              </select>
              <select
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={stockFilter}
                onChange={(e) => { setStockFilter(e.target.value); setModalPage(1); }}
              >
                <option value="">Tất cả tồn kho</option>
                <option value="in-stock">Còn hàng</option>
                <option value="low-stock">Sắp hết hàng</option>
                <option value="out-of-stock">Hết hàng</option>
              </select>
              <select
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={sortOrder}
                onChange={(e) => { setSortOrder(e.target.value); setModalPage(1); }}
              >
                <option value="name-asc">Tên A-Z</option>
                <option value="price-asc">Giá thấp đến cao</option>
                <option value="price-desc">Giá cao đến thấp</option>
                <option value="stock-asc">Tồn kho thấp trước</option>
                <option value="stock-desc">Tồn kho cao trước</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
              {loading ? (
                <div className="text-center text-slate-500 py-10">Đang tải dữ liệu...</div>
              ) : paginatedProducts.length === 0 ? (
                <div className="text-center text-slate-500 py-10 flex flex-col items-center">
                  <Search className="w-10 h-10 text-slate-300 mb-3" />
                  <p>Không tìm thấy sản phẩm nào phù hợp bộ lọc.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {paginatedProducts.map(product => {
                    const isOut = product.stock_quantity <= 0;
                    const isLow = product.stock_quantity > 0 && product.stock_quantity <= product.reorder_level;
                    
                    return (
                      <div key={product.product_id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-300 shadow-sm transition-colors">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                            <Lightbulb className="w-5 h-5 text-slate-400" />
                          </div>
                          <div className="min-w-0 pr-2">
                            <div className="font-bold text-slate-800 text-sm truncate">{product.product_name}</div>
                            <div className="text-xs text-slate-500 truncate mb-1">{product.sku} • {product.category_name}</div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-blue-600 text-sm">{formatCurrency(product.selling_price)}</span>
                              <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${isOut ? 'bg-red-100 text-red-600' : isLow ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                {isOut ? 'Hết hàng' : isLow ? `Sắp hết (${product.stock_quantity})` : `Còn hàng (${product.stock_quantity})`}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={isOut}
                          title={isOut ? "Sản phẩm đã hết hàng" : "Thêm vào hóa đơn"}
                          className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${isOut ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between">
              <div className="text-sm text-slate-500">
                Hiển thị {(modalPage - 1) * 8 + 1}-{Math.min(modalPage * 8, filteredProducts.length)} trong tổng số {filteredProducts.length} sản phẩm
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setModalPage(p => Math.max(1, p - 1))}
                  disabled={modalPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-sm font-medium px-2">Trang {modalPage} / {modalTotalPages}</div>
                <button
                  onClick={() => setModalPage(p => Math.min(modalTotalPages, p + 1))}
                  disabled={modalPage === modalTotalPages}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
