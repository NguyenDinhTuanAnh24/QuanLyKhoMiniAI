import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Package, Truck, ArrowLeftRight, CheckCircle2, DollarSign, Plus, Trash2, Search, ArrowRightLeft, AlertTriangle, FileText, ArrowDownToLine, ArrowUpFromLine, ChevronLeft, ChevronRight } from 'lucide-react';
import { getProducts } from '../services/productService';
import { getSuppliers } from '../services/supplierService';
import { createMovement, getMovements, getImportPlan } from '../services/inventoryService';
import ConfirmModal from './ConfirmModal';
import { useToast } from '../contexts/ToastContext';
import StatCard from './StatCard';
import PageContainer from './layout/PageContainer';
import InventorySkeleton from './skeletons/InventorySkeleton';
import api from '../services/api';

export default function InventoryOpsDashboard() {
  const ITEMS_PER_PAGE = 10;
  const [activeTab, setActiveTab] = useState('import'); // 'import' or 'export'
  const { addToast } = useToast();
  
  // State for Confirm Modal
  const [supplierConfirmOpen, setSupplierConfirmOpen] = useState(false);
  const [pendingSupplierId, setPendingSupplierId] = useState(null);

  const [searchParams] = useSearchParams();
  const location = useLocation();
  const processedProductIdRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    importTotal: 0,
    importValue: 0,
    exportTotal: 0,
    exportValue: 0
  });

  // Forms
  const [importForm, setImportForm] = useState(() => {
    try {
      const saved = sessionStorage.getItem('inventory_ops_import_form');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.items)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return {
      supplier_id: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
      plan_id: null,
      plan_status: null,
      items: []
    };
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('inventory_ops_import_form', JSON.stringify(importForm));
    } catch (e) {
      console.error(e);
    }
  }, [importForm]);

  const [exportForm, setExportForm] = useState({
    date: new Date().toISOString().split('T')[0],
    note: '',
    items: []
  });

  const [selectedProductSearch, setSelectedProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [qtyInput, setQtyInput] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [importPlanPage, setImportPlanPage] = useState(1);
  const [importPlanSearch, setImportPlanSearch] = useState('');

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: '', // 'IMPORT' or 'EXPORT'
    data: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isImportPlan = Boolean(importForm.plan_id);
  const normalizedImportPlanSearch = importPlanSearch.trim().toLowerCase();
  const filteredImportItems = isImportPlan && normalizedImportPlanSearch
    ? importForm.items.filter(item => {
      const productName = String(item.product_name || '').toLowerCase();
      const sku = String(item.sku || '').toLowerCase();
      return productName.includes(normalizedImportPlanSearch) || sku.includes(normalizedImportPlanSearch);
    })
    : importForm.items;
  const totalImportPlanPages = Math.max(1, Math.ceil(filteredImportItems.length / ITEMS_PER_PAGE));
  const currentImportPlanPage = Math.min(importPlanPage, totalImportPlanPages);
  const importPlanStartIndex = (currentImportPlanPage - 1) * ITEMS_PER_PAGE;
  const visibleImportItems = isImportPlan
    ? filteredImportItems.slice(importPlanStartIndex, importPlanStartIndex + ITEMS_PER_PAGE)
    : importForm.items;
  const totalImportQuantity = importForm.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalImportAmount = importForm.items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)), 0);

  useEffect(() => {
    setImportPlanPage(1);
    setImportPlanSearch('');
  }, [importForm.plan_id]);

  useEffect(() => {
    if (importPlanPage > totalImportPlanPages) {
      setImportPlanPage(totalImportPlanPages);
    }
  }, [importPlanPage, totalImportPlanPages]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      const targetId = searchParams.get('productId') || searchParams.get('product_id') || location.state?.autoSelectProductId || location.state?.product_id;
      if (targetId && processedProductIdRef.current !== targetId) {
        processedProductIdRef.current = targetId;
        const prod = products.find(p => String(p.product_id) === String(targetId) || String(p.sku) === String(targetId));
        if (prod) {
          if (activeTab !== 'import') {
            setActiveTab('import');
          }

          const rawQty = searchParams.get('quantity') || location.state?.quantity || prod.suggested_import_quantity || prod.reorder_quantity;
          let suggestedQty = Number(rawQty);
          if (!suggestedQty || suggestedQty <= 0 || isNaN(suggestedQty)) {
            if (typeof prod.reorder_level === 'number' && typeof prod.stock_quantity === 'number' && prod.reorder_level >= prod.stock_quantity) {
              suggestedQty = Math.max(10, (prod.reorder_level || 10) * 2 - (prod.stock_quantity || 0));
            } else {
              suggestedQty = 10;
            }
          }

          const unitPrice = Number(prod.import_price || prod.selling_price || 0);

          setImportForm(prev => {
            const distinctSuppliers = new Set([...prev.items.map(i => i.supplier_id), prod.supplier_id].filter(Boolean));
            const newSupplierId = distinctSuppliers.size > 1 ? 'ALL' : (prod.supplier_id || prev.supplier_id || (suppliers.length > 0 ? suppliers[0].supplier_id : ''));

            return {
              ...prev,
              supplier_id: newSupplierId
            };
          });

          setSelectedProduct(prod.product_id);
          setQtyInput(String(suggestedQty));
          setPriceInput(String(unitPrice));

        }
      }
    }
  }, [products, searchParams, location, activeTab, suppliers]);

  useEffect(() => {
    const planId = searchParams.get('planId');
    if (planId && products.length > 0 && activeTab === 'import' && (!importForm.plan_id || importForm.plan_id !== planId)) {
      setLoading(true);
      getImportPlan(planId).then(plan => {
        if (plan) {
          const items = plan.import_plan_items.map(item => ({
            product_id: item.product_id,
            product_name: item.products?.product_name || item.product_id,
            suggested_quantity: item.suggested_quantity,
            quantity: item.actual_quantity ?? item.suggested_quantity,
            unit_price: item.products?.import_price || 0,
            supplier_id: item.supplier_id || ''
          }));
          
          const distinctSuppliers = new Set(items.map(i => i.supplier_id).filter(Boolean));
          const newSupplierId = distinctSuppliers.size > 1 ? 'ALL' : (items[0]?.supplier_id || (suppliers.length > 0 ? suppliers[0].supplier_id : ''));

          setImportForm(prev => ({
            ...prev,
            supplier_id: newSupplierId,
            plan_id: plan.id,
            plan_status: plan.status,
            note: `Nhập kho từ kế hoạch AI (Mã: ${plan.id.slice(0, 8)})`,
            items: items
          }));
          
          if (plan.status === 'DRAFT') {
            addToast('info', 'Tải kế hoạch', 'Đã tải kế hoạch nhập hàng từ AI.');
          } else {
            const statusMap = { 'COMPLETED': 'Đã nhập kho', 'PENDING': 'Chờ xử lý', 'CANCELLED': 'Đã hủy' };
            addToast('warning', 'Lưu ý', `Kế hoạch nhập hàng này đang ở trạng thái ${statusMap[plan.status] || plan.status}.`);
          }
        }
      }).catch(err => {
        console.error(err);
        addToast('error', 'Lỗi', 'Không thể tải chi tiết kế hoạch nhập hàng.');
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [searchParams, products, activeTab]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [prodRes, suppRes, movRes] = await Promise.all([
        getProducts({ limit: 1000 }),
        getSuppliers({ limit: 1000 }),
        getMovements({ limit: 1000 }) // fetch all recent to calc stats
      ]);
      setProducts(prodRes.data || []);
      setSuppliers(suppRes.data || []);
      setMovements(movRes.data || []);

      // Calculate simple stats
      let iTotal = 0;
      let iValue = 0;
      let eTotal = 0;
      let eValue = 0;

      (movRes.data || []).forEach(m => {
        if (m.type === 'IMPORT') {
          iTotal++;
          iValue += (m.quantity * (m.unit_price || 0));
        } else {
          eTotal++;
          eValue += (m.quantity * (m.unit_price || 0));
        }
      });

      setStats({
        importTotal: iTotal,
        importValue: iValue,
        exportTotal: eTotal,
        exportValue: eValue
      });

    } catch (error) {
      addToast('error', 'Lỗi', 'Không thể tải dữ liệu ban đầu');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct || !qtyInput || qtyInput <= 0) {
      addToast('warning', 'Thiếu thông tin', 'Vui lòng chọn sản phẩm và nhập số lượng > 0');
      return;
    }

    const prod = products.find(p => p.product_id === selectedProduct);
    if (!prod) return;

    if (activeTab === 'import') {
      if (importForm.supplier_id !== 'ALL' && prod.supplier_id && importForm.supplier_id && prod.supplier_id !== importForm.supplier_id) {
        addToast('error', 'Lỗi', 'Sản phẩm không thuộc nhà cung cấp đã chọn.');
        return;
      }

      const price = priceInput ? Number(priceInput) : prod.import_price || 0;
      const exists = importForm.items.find(i => String(i.product_id) === String(selectedProduct));
      if (exists) {
        if (exists.quantity !== Number(qtyInput) || exists.unit_price !== price) {
          setImportForm(prev => ({
            ...prev,
            items: prev.items.map(i => String(i.product_id) === String(selectedProduct)
              ? { ...i, quantity: Number(qtyInput), unit_price: price }
              : i
            )
          }));
          addToast('success', 'Đã cập nhật', `Đã cập nhật số lượng ${prod.product_name} thành ${qtyInput}`);
        } else {
          addToast('warning', 'Đã tồn tại', 'Sản phẩm đã có trong phiếu');
        }
        return;
      }
      setImportForm(prev => ({
        ...prev,
        items: [...prev.items, { ...prod, quantity: Number(qtyInput), unit_price: price }]
      }));
    } else {
      // Export validation
      if (Number(qtyInput) > prod.stock_quantity) {
        addToast('error', 'Vượt quá tồn kho', `Sản phẩm này chỉ còn ${prod.stock_quantity} ${prod.unit_name || 'sản phẩm'}`);
        return;
      }
      const exists = exportForm.items.find(i => String(i.product_id) === String(selectedProduct));
      if (exists) {
        if (exists.quantity !== Number(qtyInput)) {
          setExportForm(prev => ({
            ...prev,
            items: prev.items.map(i => String(i.product_id) === String(selectedProduct)
              ? { ...i, quantity: Number(qtyInput) }
              : i
            )
          }));
          addToast('success', 'Đã cập nhật', `Đã cập nhật số lượng ${prod.product_name} thành ${qtyInput}`);
        } else {
          addToast('warning', 'Đã tồn tại', 'Sản phẩm đã có trong phiếu');
        }
        return;
      }
      setExportForm(prev => ({
        ...prev,
        items: [...prev.items, { ...prod, quantity: Number(qtyInput), unit_price: prod.selling_price || 0 }]
      }));
    }

    // Reset inputs
    setSelectedProduct('');
    setQtyInput('');
    setPriceInput('');
    setSelectedProductSearch('');
  };

  const removeItem = (productId) => {
    if (activeTab === 'import') {
      setImportForm(prev => ({
        ...prev,
        items: prev.items.filter(i => i.product_id !== productId)
      }));
    } else {
      setExportForm(prev => ({
        ...prev,
        items: prev.items.filter(i => i.product_id !== productId)
      }));
    }
  };

  const updateImportItem = (productId, field, value) => {
    const nextValue = value === '' ? '' : Number(value);
    setImportForm(prev => ({
      ...prev,
      items: prev.items.map(item => String(item.product_id) === String(productId)
        ? { ...item, [field]: nextValue }
        : item
      )
    }));
  };

  const handleOpenConfirm = () => {
    if (activeTab === 'import') {
      if (!importForm.supplier_id) {
        addToast('error', 'Lỗi', 'Vui lòng chọn nhà cung cấp');
        return;
      }
      if (importForm.items.length === 0) {
        addToast('error', 'Lỗi', 'Phiếu nhập phải có ít nhất 1 sản phẩm');
        return;
      }
      if (importForm.items.some(item => !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0 || !Number.isFinite(Number(item.unit_price)) || Number(item.unit_price) < 0)) {
        addToast('error', 'Lỗi', 'Số lượng phải lớn hơn 0 và giá nhập không được âm.');
        return;
      }
      setConfirmModal({
        isOpen: true,
        type: 'IMPORT',
        data: importForm
      });
    } else {
      if (exportForm.items.length === 0) {
        addToast('error', 'Lỗi', 'Phiếu xuất phải có ít nhất 1 sản phẩm');
        return;
      }
      setConfirmModal({
        isOpen: true,
        type: 'EXPORT',
        data: exportForm
      });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const isImport = confirmModal.type === 'IMPORT';
      const form = isImport ? importForm : exportForm;

      const payload = {
        type: confirmModal.type,
        note: form.note || (isImport ? `Nhập kho từ NCC` : `Xuất kho`),
        plan_id: isImport ? form.plan_id : undefined,
        items: form.items.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price
        }))
      };

      await createMovement(payload);

      addToast('success', 'Thành công', `${isImport ? 'Nhập' : 'Xuất'} kho thành công. Đã cập nhật tồn kho cho ${form.items.length} sản phẩm.`);

      // Reset
      if (isImport) {
        setImportForm({ supplier_id: '', date: new Date().toISOString().split('T')[0], items: [], note: '', plan_id: null, plan_status: null });
        try { sessionStorage.removeItem('inventory_ops_import_form'); } catch (e) { }
      } else {
        setExportForm({ ...exportForm, items: [], note: '' });
      }
      setConfirmModal({ isOpen: false, type: '', data: null });

      loadInitialData(); // Reload stats and products
    } catch (error) {
      addToast('error', 'Lỗi', error.message || 'Đã xảy ra lỗi khi lưu phiếu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  if (loading && products.length === 0) {
    return (
      <PageContainer>
        <InventorySkeleton />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nhập / Xuất kho</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý nhập hàng và xuất hàng khỏi kho</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('import')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'import' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
          <ArrowDownToLine className="w-4 h-4" /> Nhập kho
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'export' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
          <ArrowUpFromLine className="w-4 h-4" /> Xuất kho
        </button>
      </div>

      {/* Content */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          {/* Stats Import */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={ArrowDownToLine} iconColorClass="bg-blue-50 text-blue-600" label="Tổng lượt nhập" value={stats.importTotal} />
            <StatCard icon={DollarSign} iconColorClass="bg-blue-50 text-blue-600" label="Tổng giá trị nhập" value={formatCurrency(stats.importValue)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {/* Form Import */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
                {/* Banner kế hoạch AI */}
                {importForm.plan_id && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-blue-900">Kế hoạch nhập từ AI</p>
                          {(!importForm.plan_status || importForm.plan_status === 'DRAFT') && <span className="h-6 px-2.5 rounded-full text-xs font-medium flex items-center bg-blue-50 text-blue-700 border border-blue-200">Đã tạo</span>}
                          {importForm.plan_status === 'COMPLETED' && <span className="h-6 px-2.5 rounded-full text-xs font-medium flex items-center bg-emerald-50 text-emerald-700 border border-emerald-200">Đã nhập kho</span>}
                          {importForm.plan_status === 'CANCELLED' && <span className="h-6 px-2.5 rounded-full text-xs font-medium flex items-center bg-slate-100 text-slate-600 border border-slate-200">Đã hủy</span>}
                          {importForm.plan_status === 'PENDING' && <span className="h-6 px-2.5 rounded-full text-xs font-medium flex items-center bg-amber-50 text-amber-700 border border-amber-200">Chờ xử lý</span>}
                        </div>
                        <p className="text-xs text-blue-700 mt-0.5">
                          Mã: {importForm.plan_id.slice(0, 8)} · {importForm.items.length} sản phẩm
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setConfirmModal({ isOpen: true, type: 'CANCEL_PLAN', data: null })}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-white px-2 py-1 rounded border border-blue-100 hover:bg-blue-50 transition-colors"
                    >
                      Hủy kế hoạch
                    </button>
                  </div>
                )}
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Tạo Phiếu Nhập</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nhà cung cấp *</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white disabled:opacity-60"
                      value={importForm.supplier_id}
                      disabled={importForm.plan_id && importForm.plan_status !== 'DRAFT'}
                      onChange={(e) => {
                        const newSupplierId = e.target.value;
                        if (newSupplierId === 'ALL') {
                          setImportForm({ ...importForm, supplier_id: 'ALL' });
                          return;
                        }
                        if (importForm.items.length > 0) {
                          setPendingSupplierId(newSupplierId);
                          setSupplierConfirmOpen(true);
                          return;
                        }
                        setImportForm({ ...importForm, supplier_id: newSupplierId, items: [] });
                        setSelectedProduct('');
                        setQtyInput('');
                        setPriceInput('');
                      }}
                    >
                      <option value="">-- Chọn nhà cung cấp --</option>
                      <option value="ALL">-- Tổng hợp (Nhiều nhà cung cấp) --</option>
                      {suppliers.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ngày nhập</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-60"
                      value={importForm.date}
                      disabled={importForm.plan_id && importForm.plan_status !== 'DRAFT'}
                      onChange={(e) => setImportForm({ ...importForm, date: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                    <input
                      type="text"
                      placeholder="Ghi chú nhập kho..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-60"
                      value={importForm.note}
                      disabled={importForm.plan_id && importForm.plan_status !== 'DRAFT'}
                      onChange={(e) => setImportForm({ ...importForm, note: e.target.value })}
                    />
                  </div>
                </div>

                {/* Product Select */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                  <h4 className="text-sm font-medium text-slate-800">Thêm sản phẩm vào phiếu</h4>
                  <div className="flex flex-col md:flex-row gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Sản phẩm</label>
                      <select
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                        value={selectedProduct}
                        onChange={(e) => {
                          setSelectedProduct(e.target.value);
                          const p = products.find(x => x.product_id === e.target.value);
                          if (p) setPriceInput(p.import_price || 0);
                        }}
                        disabled={!importForm.supplier_id}
                      >
                        {!importForm.supplier_id ? (
                          <option value="">Vui lòng chọn nhà cung cấp trước</option>
                        ) : (
                          <>
                            <option value="">-- Chọn sản phẩm --</option>
                            {products.filter(p => importForm.supplier_id === 'ALL' || p.supplier_id === importForm.supplier_id).length === 0 ? (
                              <option value="" disabled>Nhà cung cấp này chưa có sản phẩm</option>
                            ) : (
                              products
                                .filter(p => importForm.supplier_id === 'ALL' || p.supplier_id === importForm.supplier_id)
                                .map(p => <option key={p.product_id} value={p.product_id}>{p.sku} - {p.product_name}</option>)
                            )}
                          </>
                        )}
                      </select>
                    </div>
                    <div className="w-full md:w-24">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Số lượng</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        value={qtyInput}
                        onChange={e => setQtyInput(e.target.value)}
                      />
                    </div>
                    <div className="w-full md:w-32">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Giá nhập (đ)</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        value={priceInput}
                        onChange={e => setPriceInput(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={handleAddItem}
                      className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Thêm
                    </button>
                  </div>
                </div>

                {/* List Items */}
                {isImportPlan && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="search"
                      value={importPlanSearch}
                      onChange={event => {
                        setImportPlanSearch(event.target.value);
                        setImportPlanPage(1);
                      }}
                      placeholder="Tìm sản phẩm trong kế hoạch..."
                      className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Tìm sản phẩm trong kế hoạch"
                    />
                  </div>
                )}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[680px]">
                      <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-medium">
                        <tr>
                          <th className="p-3">Sản phẩm</th>
                          <th className="p-3 text-center">SL thực nhập</th>
                          <th className="p-3 text-right">Giá nhập</th>
                          <th className="p-3 text-right">Thành tiền</th>
                          <th className="p-3 text-center w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {visibleImportItems.length === 0 ? (
                          <tr><td colSpan="5" className="p-6 text-center text-slate-400">{normalizedImportPlanSearch ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có sản phẩm nào trong phiếu'}</td></tr>
                        ) : (
                          visibleImportItems.map(item => (
                            <tr key={item.product_id} className="hover:bg-slate-50">
                              <td className="p-3">
                                <div className="font-medium text-slate-900">{item.product_name}</div>
                                <div className="text-xs text-slate-500">{item.sku}</div>
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    disabled={importForm.plan_id && importForm.plan_status !== 'DRAFT'}
                                    onChange={event => updateImportItem(item.product_id, 'quantity', event.target.value)}
                                    className="w-24 rounded-md border border-slate-200 px-2 py-1 text-center font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:bg-slate-50"
                                    aria-label={`Số lượng thực nhập của ${item.product_name}`}
                                  />
                                  {isImportPlan && item.suggested_quantity != null && (
                                    <span className="text-[11px] text-slate-400">AI đề xuất: {item.suggested_quantity}</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  value={item.unit_price}
                                  disabled={importForm.plan_id && importForm.plan_status !== 'DRAFT'}
                                  onChange={event => updateImportItem(item.product_id, 'unit_price', event.target.value)}
                                  className="w-32 rounded-md border border-slate-200 px-2 py-1 text-right text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:bg-slate-50"
                                  aria-label={`Giá nhập của ${item.product_name}`}
                                />
                              </td>
                              <td className="p-3 text-right font-medium text-blue-600">{formatCurrency((Number(item.quantity) || 0) * (Number(item.unit_price) || 0))}</td>
                              <td className="p-3 text-center">
                                {(!importForm.plan_id || importForm.plan_status === 'DRAFT') && (
                                <button onClick={() => removeItem(item.product_id)} className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors" aria-label={`Xóa ${item.product_name}`}>
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>


                  {/* Mobile Card view */}
                  <div className="md:hidden flex flex-col divide-y divide-slate-100 bg-white">
                    {visibleImportItems.length === 0 ? (
                      <div className="p-6 text-center text-slate-400">
                        {normalizedImportPlanSearch ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có sản phẩm nào trong phiếu'}
                      </div>
                    ) : (
                      visibleImportItems.map(item => (
                        <div key={item.product_id} className="p-4 flex flex-col gap-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-slate-900 truncate">{item.product_name}</h4>
                              <div className="text-xs text-slate-500 mt-1">{item.sku}</div>
                            </div>
                            {(!importForm.plan_id || importForm.plan_status === 'DRAFT') && (
                              <button onClick={() => removeItem(item.product_id)} className="shrink-0 p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors" aria-label={`Xóa ${item.product_name}`}>
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-3 mt-1">
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Số lượng</label>
                              <div className="flex flex-col gap-1">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  disabled={importForm.plan_id && importForm.plan_status !== 'DRAFT'}
                                  onChange={event => updateImportItem(item.product_id, 'quantity', event.target.value)}
                                  className="w-full rounded-md border border-slate-200 px-2 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:bg-slate-50"
                                />
                                {isImportPlan && item.suggested_quantity != null && (
                                  <span className="text-[11px] text-slate-400">AI: {item.suggested_quantity}</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Đơn giá</label>
                              <input
                                type="number"
                                min="0"
                                value={item.unit_price}
                                disabled={importForm.plan_id && importForm.plan_status !== 'DRAFT'}
                                onChange={event => updateImportItem(item.product_id, 'unit_price', event.target.value)}
                                className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:bg-slate-50"
                              />
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                            <span className="text-sm font-medium text-slate-700">Thành tiền:</span>
                            <span className="font-bold text-blue-600">{formatCurrency((Number(item.quantity) || 0) * (Number(item.unit_price) || 0))}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {isImportPlan && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200 bg-white px-3 py-3 text-xs text-slate-500">
                      <span>
                        {filteredImportItems.length === 0
                          ? 'Hiển thị 0–0 / 0 kết quả'
                          : `Hiển thị ${importPlanStartIndex + 1}–${Math.min(importPlanStartIndex + ITEMS_PER_PAGE, filteredImportItems.length)} / ${filteredImportItems.length} ${normalizedImportPlanSearch ? 'kết quả' : 'sản phẩm'}`}
                      </span>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setImportPlanPage(page => Math.max(1, page - 1))}
                          disabled={currentImportPlanPage === 1}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Trang trước"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="hidden sm:inline">Trước</span>
                        </button>
                        <span className="min-w-[88px] text-center font-medium text-slate-700">Trang {currentImportPlanPage} / {totalImportPlanPages}</span>
                        <button
                          type="button"
                          onClick={() => setImportPlanPage(page => Math.min(totalImportPlanPages, page + 1))}
                          disabled={currentImportPlanPage === totalImportPlanPages}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Trang sau"
                        >
                          <span className="hidden sm:inline">Sau</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="text-sm text-slate-600">
                    Tổng số lượng: <span className="font-bold text-slate-900">{totalImportQuantity}</span>
                  </div>
                  <div className="text-base text-slate-600">
                    Tổng tiền: <span className="text-xl font-bold text-blue-600">{formatCurrency(totalImportAmount)}</span>
                  </div>
                </div>

                {(!importForm.plan_id || importForm.plan_status === 'DRAFT') && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleOpenConfirm}
                    disabled={importForm.items.length === 0 || !importForm.supplier_id}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Xác nhận nhập kho
                  </button>
                </div>
                )}
              </div>
            </div>

            {/* History Import */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm h-[520px] flex flex-col overflow-hidden">
              <div className="shrink-0 border-b border-slate-100 px-5 py-4 bg-white z-10">
                <h3 className="font-bold text-slate-900">Lịch sử nhập kho gần đây</h3>
              </div>
              <div className="flex-1 overflow-y-auto bg-white p-4 pr-2 space-y-3">
                {movements.filter(m => m.type === 'IMPORT').slice(0, 10).map((m, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{m.products?.product_name || m.product_id}</div>
                      <div className="text-xs text-slate-500">{new Date(m.created_at).toLocaleString('vi-VN')}</div>
                      <div className="text-xs text-slate-500 mt-1">Ghi chú: {m.note || 'Không có'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-blue-600">+{m.quantity} {m.products?.unit_name || 'sản phẩm'}</div>
                      <div className="text-xs text-slate-500">{formatCurrency(m.unit_price)}</div>
                    </div>
                  </div>
                ))}
                {movements.filter(m => m.type === 'IMPORT').length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm py-10">
                    Chưa có dữ liệu
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'export' && (
        <div className="space-y-6">
          {/* Stats Export */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={ArrowUpFromLine} iconColorClass="bg-blue-50 text-blue-600" label="Tổng lượt xuất" value={stats.exportTotal} />
            <StatCard icon={DollarSign} iconColorClass="bg-blue-50 text-blue-600" label="Tổng giá trị xuất" value={formatCurrency(stats.exportValue)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {/* Form Export */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Tạo Phiếu Xuất</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ngày xuất</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      value={exportForm.date}
                      onChange={(e) => setExportForm({ ...exportForm, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lý do / Ghi chú</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Xuất hàng hỏng, điều chỉnh..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      value={exportForm.note}
                      onChange={(e) => setExportForm({ ...exportForm, note: e.target.value })}
                    />
                  </div>
                </div>

                {/* Product Select */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                  <h4 className="text-sm font-medium text-slate-800">Thêm sản phẩm xuất</h4>
                  <div className="flex flex-col md:flex-row gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Sản phẩm</label>
                      <select
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                      >
                        <option value="">-- Chọn sản phẩm --</option>
                        {products.filter(p => p.stock_quantity > 0).map(p => (
                          <option key={p.product_id} value={p.product_id}>
                            {p.sku} - {p.product_name} (Tồn: {p.stock_quantity})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-full md:w-32">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Số lượng xuất</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        value={qtyInput}
                        onChange={e => setQtyInput(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={handleAddItem}
                      className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Thêm
                    </button>
                  </div>
                </div>

                {/* List Items */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-full">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-medium">
                      <tr>
                        <th className="p-3">Sản phẩm</th>
                        <th className="p-3 text-center">Tồn hiện tại</th>
                        <th className="p-3 text-center">SL Xuất</th>
                        <th className="p-3 text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {exportForm.items.length === 0 ? (
                        <tr><td colSpan="4" className="p-6 text-center text-slate-400">Chưa có sản phẩm nào trong phiếu</td></tr>
                      ) : (
                        exportForm.items.map(item => (
                          <tr key={item.product_id} className="hover:bg-slate-50">
                            <td className="p-3">
                              <div className="font-medium text-slate-900">{item.product_name}</div>
                              <div className="text-xs text-slate-500">{item.sku}</div>
                            </td>
                            <td className="p-3 text-center text-slate-600">{item.stock_quantity}</td>
                            <td className="p-3 text-center font-bold text-blue-600">{item.quantity}</td>
                            <td className="p-3 text-center">
                              <button onClick={() => removeItem(item.product_id)} className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  </div>

                  {/* Mobile List View */}
                  <div className="md:hidden flex flex-col divide-y divide-slate-100 bg-white">
                    {exportForm.items.length === 0 ? (
                      <div className="p-6 text-center text-slate-400">Chưa có sản phẩm nào trong phiếu</div>
                    ) : (
                      exportForm.items.map(item => (
                        <div key={item.product_id} className="p-4 flex flex-col gap-2">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-slate-900 truncate">{item.product_name}</h4>
                              <div className="text-xs text-slate-500 mt-1">{item.sku}</div>
                            </div>
                            <button onClick={() => removeItem(item.product_id)} className="shrink-0 p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50 text-sm">
                            <span className="text-slate-600">Tồn hiện tại: <span className="font-medium">{item.stock_quantity}</span></span>
                            <span className="text-slate-600">SL Xuất: <span className="font-bold text-blue-600">{item.quantity}</span></span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Summary */}
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="text-sm text-slate-600">
                    Tổng số lượng xuất: <span className="font-bold text-slate-900">{exportForm.items.reduce((a, b) => a + b.quantity, 0)}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleOpenConfirm}
                    disabled={exportForm.items.length === 0}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Xác nhận xuất kho
                  </button>
                </div>
              </div>
            </div>

            {/* History Export */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm h-[520px] flex flex-col overflow-hidden">
              <div className="shrink-0 border-b border-slate-100 px-5 py-4 bg-white z-10">
                <h3 className="font-bold text-slate-900">Lịch sử xuất kho gần đây</h3>
              </div>
              <div className="flex-1 overflow-y-auto bg-white p-4 pr-2 space-y-3">
                {movements.filter(m => m.type === 'EXPORT' || m.type === 'SALE').slice(0, 10).map((m, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{m.products?.product_name || m.product_id}</div>
                      <div className="text-xs text-slate-500">{new Date(m.created_at).toLocaleString('vi-VN')} - {m.type === 'SALE' ? 'Bán hàng' : 'Xuất kho'}</div>
                      <div className="text-xs text-slate-500 mt-1">Ghi chú: {m.note || 'Không có'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-blue-600">-{m.quantity} {m.products?.unit_name || 'sản phẩm'}</div>
                    </div>
                  </div>
                ))}
                {movements.filter(m => m.type === 'EXPORT' || m.type === 'SALE').length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm py-10">
                    Chưa có dữ liệu
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 flex items-center gap-3 bg-blue-50 text-blue-700">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-lg">
                {confirmModal.type === 'CANCEL_PLAN' ? 'Hủy kế hoạch nhập' : `Xác nhận ${confirmModal.type === 'IMPORT' ? 'nhập' : 'xuất'} kho`}
              </h3>
            </div>

            <div className="p-6 space-y-4 text-slate-600 text-sm">
              {confirmModal.type === 'CANCEL_PLAN' ? (
                <p>Bạn có chắc muốn hủy kế hoạch nhập này? Tồn kho sẽ không bị thay đổi.</p>
              ) : (
                <p>Bạn có chắc chắn muốn {confirmModal.type === 'IMPORT' ? 'nhập' : 'xuất'} các sản phẩm này {confirmModal.type === 'IMPORT' ? 'vào' : 'khỏi'} kho không?</p>
              )}

                {confirmModal.type !== 'CANCEL_PLAN' && (
              <div className="bg-slate-50 p-4 rounded-lg space-y-2 border border-slate-100">
                {confirmModal.type === 'IMPORT' && confirmModal.data.supplier_id && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nhà cung cấp:</span>
                    <span className="font-medium text-slate-900">
                      {suppliers.find(s => s.supplier_id === confirmModal.data.supplier_id)?.supplier_name}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngày {confirmModal.type === 'IMPORT' ? 'nhập' : 'xuất'}:</span>
                  <span className="font-medium text-slate-900">{new Date(confirmModal.data.date).toLocaleDateString('vi-VN')}</span>
                </div>
                {confirmModal.data.note && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ghi chú:</span>
                    <span className="font-medium text-slate-900">{confirmModal.data.note}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Số loại sản phẩm:</span>
                  <span className="font-medium text-slate-900">{confirmModal.data.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tổng số lượng {confirmModal.type === 'IMPORT' ? 'nhập' : 'xuất'}:</span>
                  <span className="font-medium text-slate-900">{confirmModal.data.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)}</span>
                </div>
                {confirmModal.type === 'IMPORT' && (
                  <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                    <span className="text-slate-500">Tổng giá trị:</span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(confirmModal.data.items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)), 0))}
                    </span>
                  </div>
                )}
              </div>
              )}

              {confirmModal.type !== 'CANCEL_PLAN' && confirmModal.data?.items && (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="p-2">Sản phẩm</th>
                      <th className="p-2 text-center">SL</th>
                      {confirmModal.type === 'IMPORT' ? <th className="p-2 text-right">Giá</th> : <th className="p-2 text-center">Tồn</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {confirmModal.data.items.slice(0, 3).map(item => (
                      <tr key={item.product_id} className="bg-white">
                        <td className="p-2 font-medium text-slate-900 truncate max-w-[150px]">{item.product_name}</td>
                        <td className="p-2 text-center font-bold text-blue-600">{item.quantity}</td>
                        {confirmModal.type === 'IMPORT' ? (
                          <td className="p-2 text-right text-slate-600">{formatCurrency(item.unit_price)}</td>
                        ) : (
                          <td className="p-2 text-center text-slate-600">{item.stock_quantity}</td>
                        )}
                      </tr>
                    ))}
                    {confirmModal.data.items.length > 3 && (
                      <tr>
                        <td colSpan="3" className="p-2 text-center text-slate-500 bg-slate-50 italic">
                          +{confirmModal.data.items.length - 3} sản phẩm khác
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setConfirmModal({ isOpen: false, type: '', data: null })}
                className="px-4 py-2 border border-slate-200 text-slate-700 bg-white rounded-lg hover:bg-slate-50 font-medium disabled:opacity-50"
              >
                {confirmModal.type === 'CANCEL_PLAN' ? 'Quay lại' : 'Hủy'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmModal.type === 'CANCEL_PLAN') {
                    setImportForm({ supplier_id: '', date: new Date().toISOString().split('T')[0], note: '', plan_id: null, plan_status: null, items: [] });
                    setConfirmModal({ isOpen: false, type: '', data: null });
                    addToast('info', 'Đã hủy', 'Đã hủy kế hoạch nhập, bạn có thể tạo phiếu mới.');
                  } else {
                    handleSubmit();
                  }
                }}
                disabled={isSubmitting}
                className={`px-4 py-2 text-white rounded-lg font-medium disabled:opacity-50 flex items-center gap-2 ${confirmModal.type === 'CANCEL_PLAN' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {isSubmitting ? 'Đang xử lý...' : confirmModal.type === 'CANCEL_PLAN' ? 'Xác nhận hủy' : `Xác nhận ${confirmModal.type === 'IMPORT' ? 'nhập' : 'xuất'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={supplierConfirmOpen}
        onClose={() => setSupplierConfirmOpen(false)}
        onConfirm={() => {
          setImportForm({ ...importForm, supplier_id: pendingSupplierId, items: [] });
          setSelectedProduct('');
          setQtyInput('');
          setPriceInput('');
          setSupplierConfirmOpen(false);
        }}
        title="Xác nhận đổi nhà cung cấp"
        message="Đổi nhà cung cấp sẽ xóa các sản phẩm đã thêm vào phiếu. Bạn có chắc chắn không?"
        confirmText="Đồng ý"
        cancelText="Hủy"
        isDanger={true}
      />
    </PageContainer>
  );
}
