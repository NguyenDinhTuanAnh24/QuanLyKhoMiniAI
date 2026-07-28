import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Package, Truck, ArrowLeftRight, CheckCircle2, DollarSign, Plus, Trash2, Search, ArrowRightLeft, AlertTriangle, FileText, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { getProducts } from '../services/productService';
import { getSuppliers } from '../services/supplierService';
import { createMovement, getMovements } from '../services/inventoryService';
import ConfirmModal from './ConfirmModal';
import { useToast } from '../contexts/ToastContext';
import StatCard from './StatCard';

export default function InventoryOpsDashboard() {
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

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: '', // 'IMPORT' or 'EXPORT'
    data: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

          addToast('info', 'Đã chọn sẵn', `Đã điền thông tin sản phẩm ${prod.product_name} (${suggestedQty} ${prod.unit_name || 'SP'})`);
        }
      }
    }
  }, [products, searchParams, location, activeTab, suppliers]);

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
        setImportForm({ ...importForm, items: [], note: '' });
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

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
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
            <StatCard icon={DollarSign} iconColorClass="bg-purple-50 text-purple-600" label="Tổng giá trị nhập" value={formatCurrency(stats.importValue)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {/* Form Import */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Tạo Phiếu Nhập</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nhà cung cấp *</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                      value={importForm.supplier_id}
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
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      value={importForm.date}
                      onChange={(e) => setImportForm({ ...importForm, date: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                    <input
                      type="text"
                      placeholder="Ghi chú nhập kho..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      value={importForm.note}
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
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse min-w-full">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-medium">
                      <tr>
                        <th className="p-3">Sản phẩm</th>
                        <th className="p-3 text-center">SL</th>
                        <th className="p-3 text-right">Giá nhập</th>
                        <th className="p-3 text-right">Thành tiền</th>
                        <th className="p-3 text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {importForm.items.length === 0 ? (
                        <tr><td colSpan="5" className="p-6 text-center text-slate-400">Chưa có sản phẩm nào trong phiếu</td></tr>
                      ) : (
                        importForm.items.map(item => (
                          <tr key={item.product_id} className="hover:bg-slate-50">
                            <td className="p-3">
                              <div className="font-medium text-slate-900">{item.product_name}</div>
                              <div className="text-xs text-slate-500">{item.sku}</div>
                            </td>
                            <td className="p-3 text-center font-medium">{item.quantity}</td>
                            <td className="p-3 text-right text-slate-600">{formatCurrency(item.unit_price)}</td>
                            <td className="p-3 text-right font-medium text-blue-600">{formatCurrency(item.quantity * item.unit_price)}</td>
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

                {/* Summary */}
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="text-sm text-slate-600">
                    Tổng số lượng: <span className="font-bold text-slate-900">{importForm.items.reduce((a, b) => a + b.quantity, 0)}</span>
                  </div>
                  <div className="text-base text-slate-600">
                    Tổng tiền: <span className="text-xl font-bold text-blue-600">{formatCurrency(importForm.items.reduce((a, b) => a + (b.quantity * b.unit_price), 0))}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleOpenConfirm}
                    disabled={importForm.items.length === 0 || !importForm.supplier_id}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Xác nhận nhập kho
                  </button>
                </div>
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
            <StatCard icon={DollarSign} iconColorClass="bg-purple-50 text-purple-600" label="Tổng giá trị xuất" value={formatCurrency(stats.exportValue)} />
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
                Xác nhận {confirmModal.type === 'IMPORT' ? 'nhập' : 'xuất'} kho
              </h3>
            </div>

            <div className="p-6 space-y-4 text-slate-600 text-sm">
              <p>Bạn có chắc chắn muốn {confirmModal.type === 'IMPORT' ? 'nhập' : 'xuất'} các sản phẩm này {confirmModal.type === 'IMPORT' ? 'vào' : 'khỏi'} kho không?</p>

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
                  <span className="font-medium text-slate-900">{confirmModal.data.items.reduce((a, b) => a + b.quantity, 0)}</span>
                </div>
                {confirmModal.type === 'IMPORT' && (
                  <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                    <span className="text-slate-500">Tổng giá trị:</span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(confirmModal.data.items.reduce((a, b) => a + (b.quantity * b.unit_price), 0))}
                    </span>
                  </div>
                )}
              </div>

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
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setConfirmModal({ isOpen: false, type: '', data: null })}
                className="px-4 py-2 border border-slate-200 text-slate-700 bg-white rounded-lg hover:bg-slate-50 font-medium disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 text-white rounded-lg font-medium disabled:opacity-50 flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? 'Đang xử lý...' : `Xác nhận ${confirmModal.type === 'IMPORT' ? 'nhập' : 'xuất'}`}
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
    </div>
  );
}
