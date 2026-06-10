import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Lightbulb, X, Save } from 'lucide-react';
import { createProduct, updateProduct } from '../services/productService';
import { getCategories } from '../services/categoryService';
import { getUnits } from '../services/unitService';
import { getSuppliers } from '../services/supplierService';
import { useToast } from '../contexts/ToastContext';

export default function ProductFormModal({ payload, onClose, onSuccess }) {
  const { showToast } = useToast();
  const isEdit = !!payload?.product;
  const initialProduct = payload?.product || {};

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [dataToSave, setDataToSave] = useState(null);
  const [calculatedChanges, setCalculatedChanges] = useState([]);

  const [formData, setFormData] = useState({
    product_name: initialProduct.product_name || '',
    product_name_en: initialProduct.product_name_en || '',
    sku: initialProduct.sku || '',
    category_id: initialProduct.category_id || '',
    unit_id: initialProduct.unit_id || '',
    supplier_id: initialProduct.supplier_id || '',
    description: initialProduct.description || '',
    import_price: initialProduct.import_price || 0,
    selling_price: initialProduct.selling_price || 0,
    stock_quantity: initialProduct.stock_quantity || 0,
    reorder_level: initialProduct.reorder_level || 10,
    reorder_quantity: initialProduct.reorder_quantity || 0,
    date_received: initialProduct.date_received ? initialProduct.date_received.split('T')[0] : '',
    expiration_date: initialProduct.expiration_date ? initialProduct.expiration_date.split('T')[0] : '',
    warehouse_location: initialProduct.warehouse_location || '',
    status: initialProduct.status || 'Đang bán'
  });

  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Image handling states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [catRes, unitRes, supRes] = await Promise.all([
          getCategories({ limit: 1000 }),
          getUnits({ limit: 1000 }),
          getSuppliers({ limit: 1000 })
        ]);
        setCategories(catRes.data || []);
        setUnits(unitRes.data || []);
        setSuppliers(supRes.data || []);
      } catch (err) {
        console.error("Failed to load master data", err);
      }
    };
    loadMasterData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name.includes('price') || name.includes('quantity') || name.includes('level')) 
                ? Number(value) 
                : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    if (file.type !== 'image/png' && file.type !== 'image/jpeg' && file.type !== 'image/jpg') {
      setErrorMsg("Chỉ hỗ trợ ảnh PNG hoặc JPG.");
      return;
    }

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("Ảnh sản phẩm không được vượt quá 2MB.");
      return;
    }

    setErrorMsg("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const name = formData.product_name?.trim();
    const sku = formData.sku?.trim();
    if (!name) return "Tên sản phẩm là bắt buộc.";
    if (!sku) return "Mã SKU là bắt buộc.";
    if (!formData.category_id) return "Vui lòng chọn danh mục.";
    if (!formData.unit_id) return "Vui lòng chọn đơn vị tính.";
    if (!formData.supplier_id) return "Vui lòng chọn nhà cung cấp.";
    if (formData.import_price < 0) return "Giá nhập phải >= 0.";
    if (formData.selling_price < 0) return "Giá bán phải >= 0.";
    if (formData.selling_price < formData.import_price) return "Giá bán không được nhỏ hơn giá nhập.";
    if (formData.stock_quantity < 0) return "Số lượng tồn kho phải >= 0.";
    if (formData.reorder_level < 0) return "Mức tồn tối thiểu phải >= 0.";
    if (formData.reorder_quantity < 0) return "Đề xuất nhập phải >= 0.";
    if (formData.date_received && formData.expiration_date) {
      if (new Date(formData.expiration_date) < new Date(formData.date_received)) {
        return "Ngày hết hạn không được trước ngày nhập hàng.";
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const err = validate();
    if (err) {
      setErrorMsg(err);
      showToast({
        type: "warning",
        title: "Cảnh báo",
        message: "Vui lòng kiểm tra lại các trường bắt buộc."
      });
      return;
    }

    const dataToSaveDraft = { 
      ...formData,
      product_name: formData.product_name.trim(),
      sku: formData.sku.trim()
    };
    
    const cat = categories.find(c => c.category_id === formData.category_id);
    if (cat) dataToSaveDraft.category_name = cat.category_name;
    
    const unit = units.find(u => u.unit_id === formData.unit_id);
    if (unit) dataToSaveDraft.unit_name = unit.unit_name;

    const sup = suppliers.find(s => s.supplier_id === formData.supplier_id);
    if (sup) dataToSaveDraft.supplier_name = sup.supplier_name;
    
    if (!dataToSaveDraft.date_received) dataToSaveDraft.date_received = null;
    if (!dataToSaveDraft.expiration_date) dataToSaveDraft.expiration_date = null;

    if (isEdit) {
      const changesArr = [];
      const fieldsToCheck = [
        { key: 'product_name', label: 'Tên sản phẩm', type: 'string' },
        { key: 'sku', label: 'SKU', type: 'string' },
        { key: 'category_id', label: 'Danh mục', displayKey: 'category_name' },
        { key: 'unit_id', label: 'Đơn vị tính', displayKey: 'unit_name' },
        { key: 'supplier_id', label: 'Nhà cung cấp', displayKey: 'supplier_name' },
        { key: 'product_name_en', label: 'Tên tiếng Anh', type: 'string' },
        { key: 'import_price', label: 'Giá nhập', type: 'number', isCurrency: true },
        { key: 'selling_price', label: 'Giá bán', type: 'number', isCurrency: true },
        { key: 'stock_quantity', label: 'Số lượng tồn kho', type: 'number' },
        { key: 'reorder_level', label: 'Mức tồn tối thiểu', type: 'number' },
        { key: 'reorder_quantity', label: 'Đề xuất nhập', type: 'number' },
        { key: 'date_received', label: 'Ngày nhập hàng', type: 'date' },
        { key: 'expiration_date', label: 'Ngày hết hạn', type: 'date' },
        { key: 'warehouse_location', label: 'Vị trí kho', type: 'string' },
        { key: 'status', label: 'Trạng thái', type: 'string' }
      ];

      fieldsToCheck.forEach(f => {
        let oldRaw = initialProduct[f.key];
        let newRaw = dataToSaveDraft[f.key];

        // normalize strings
        if (f.type === 'string' || !f.type) {
           oldRaw = (oldRaw || '').toString().trim();
           newRaw = (newRaw || '').toString().trim();
        }
        
        // normalize numbers
        if (f.type === 'number') {
           oldRaw = Number(oldRaw) || 0;
           newRaw = Number(newRaw) || 0;
        }

        // normalize dates (compare as YYYY-MM-DD if exists)
        if (f.type === 'date') {
           oldRaw = oldRaw ? oldRaw.toString().split('T')[0] : '';
           newRaw = newRaw ? newRaw.toString().split('T')[0] : '';
        }

        if (oldRaw !== newRaw) {
           let oldVal = initialProduct[f.displayKey || f.key];
           let newVal = dataToSaveDraft[f.displayKey || f.key];
           
           if (f.isCurrency) {
             oldVal = oldVal ? Number(oldVal).toLocaleString('vi-VN') + ' đ' : '0 đ';
             newVal = newVal ? Number(newVal).toLocaleString('vi-VN') + ' đ' : '0 đ';
           } else if (f.type === 'date') {
             // format date to DD/MM/YYYY
             const formatDate = (d) => {
                if (!d) return '';
                const str = d.toString().split('T')[0];
                const parts = str.split('-');
                if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                return str;
             }
             oldVal = formatDate(oldVal);
             newVal = formatDate(newVal);
           }
           
           changesArr.push({ label: f.label, oldVal: oldVal || 'Chưa có', newVal: newVal || 'Chưa có' });
        }
      });

      if (changesArr.length === 0) {
        showToast({
          type: "info",
          message: "Chưa có thay đổi nào để lưu."
        });
        return; 
      }
      setCalculatedChanges(changesArr);
    }

    setDataToSave(dataToSaveDraft);
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setLoading(true);
    try {
      if (isEdit) {
        await updateProduct(initialProduct.product_id, dataToSave);
        showToast({
          type: "success",
          title: "Thành công",
          message: "Cập nhật sản phẩm thành công"
        });
      } else {
        await createProduct(dataToSave);
        showToast({
          type: "success",
          title: "Thành công",
          message: "Thêm sản phẩm thành công"
        });
      }
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "Đã có lỗi xảy ra khi lưu sản phẩm.";
      
      if (msg.toLowerCase().includes('sku')) {
        showToast({
          type: "error",
          title: "Lỗi",
          message: "SKU đã tồn tại trong hệ thống."
        });
      } else {
        showToast({
          type: "error",
          title: "Lỗi",
          message: isEdit ? "Không thể cập nhật sản phẩm. Vui lòng thử lại." : "Không thể thêm sản phẩm. Vui lòng kiểm tra lại thông tin."
        });
      }
      setErrorMsg(msg);
      setShowConfirmModal(false); // only close confirm modal, keep form open
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-50 w-full max-w-6xl rounded-2xl shadow-xl flex flex-col max-h-full my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white rounded-t-2xl flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
            <p className="text-slate-500 text-sm mt-0.5">Điền đầy đủ thông tin sản phẩm vào các trường bên dưới</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 border border-red-200 mb-6">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Lõi bên trái: 2/3 */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* Card: Thông tin cơ bản */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Thông tin cơ bản</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tên sản phẩm *</label>
                    <input 
                      type="text" 
                      name="product_name"
                      value={formData.product_name}
                      onChange={handleChange}
                      placeholder="Nhập tên sản phẩm..." 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Mã SKU *</label>
                      <input 
                        type="text" 
                        name="sku"
                        value={formData.sku}
                        onChange={handleChange}
                        placeholder="VD: SP-001" 
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Danh mục *</label>
                      <select 
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                      >
                        <option value="">Chọn danh mục</option>
                        {categories.map(c => (
                          <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nhà cung cấp *</label>
                      <select 
                        name="supplier_id"
                        value={formData.supplier_id}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                      >
                        <option value="">Chọn nhà cung cấp</option>
                        {suppliers.map(s => (
                          <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Đơn vị tính *</label>
                      <select 
                        name="unit_id"
                        value={formData.unit_id}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                      >
                        <option value="">Chọn đơn vị</option>
                        {units.map(u => (
                          <option key={u.unit_id} value={u.unit_id}>{u.unit_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tên tiếng Anh (Tuỳ chọn)</label>
                    <input 
                      type="text" 
                      name="product_name_en"
                      value={formData.product_name_en}
                      onChange={handleChange}
                      placeholder="Nhập tên tiếng anh..." 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả sản phẩm</label>
                    <textarea 
                      rows="3" 
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Nhập mô tả..." 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Card: Giá và Tồn kho */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Giá và Tồn kho</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Giá nhập (VND) *</label>
                    <input 
                      type="number" 
                      name="import_price"
                      value={formData.import_price}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Giá bán (VND) *</label>
                    <input 
                      type="number" 
                      name="selling_price"
                      value={formData.selling_price}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng tồn kho *</label>
                    <input 
                      type="number" 
                      name="stock_quantity"
                      value={formData.stock_quantity}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mức tồn tối thiểu</label>
                    <input 
                      type="number" 
                      name="reorder_level"
                      value={formData.reorder_level}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Đề xuất nhập</label>
                    <input 
                      type="number" 
                      name="reorder_quantity"
                      value={formData.reorder_quantity}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                    />
                  </div>
                </div>
              </div>

              {/* Card: Thông tin kho */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Thông tin kho</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ngày nhập hàng</label>
                    <input 
                      type="date" 
                      name="date_received"
                      value={formData.date_received}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ngày hết hạn</label>
                    <input 
                      type="date" 
                      name="expiration_date"
                      value={formData.expiration_date}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vị trí kho</label>
                    <input 
                      type="text" 
                      name="warehouse_location"
                      value={formData.warehouse_location}
                      onChange={handleChange}
                      placeholder="VD: Kệ A1"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Cột bên phải: 1/3 */}
            <div className="space-y-6">
              
              {/* Hình ảnh */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">Hình ảnh sản phẩm</h2>
                <label className="border-2 border-dashed border-blue-200 bg-blue-50 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-100 transition-colors relative overflow-hidden group min-h-[160px]">
                  <input type="file" className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={handleImageChange} />
                  {imagePreview ? (
                    <div className="absolute inset-0 w-full h-full p-2">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                      <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg m-2">
                        <span className="text-white text-sm font-medium">Thay đổi ảnh</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-10 h-10 text-blue-500 mb-3" />
                      <p className="text-sm font-medium text-slate-700">Kéo thả hoặc nhấn để tải ảnh</p>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG tối đa 2MB</p>
                    </>
                  )}
                </label>
              </div>

              {/* Trạng thái */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">Trạng thái sản phẩm</h2>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <input 
                      type="radio" 
                      name="status"
                      value="Đang bán"
                      checked={formData.status === 'Đang bán'}
                      onChange={handleChange}
                      className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500" 
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900">Đang bán</div>
                      <div className="text-xs text-slate-500">Hiển thị và cho phép bán</div>
                    </div>
                  </label>
                  
                  <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <input 
                      type="radio" 
                      name="status"
                      value="Tạm ngưng"
                      checked={formData.status === 'Tạm ngưng' || formData.status === 'Tạm ngừng'}
                      onChange={handleChange}
                      className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500" 
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900">Tạm ngưng</div>
                      <div className="text-xs text-slate-500">Ẩn sản phẩm, không bán</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Lưu ý */}
              <div className="bg-blue-50 p-6 rounded-xl shadow-sm border border-blue-100">
                <h2 className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-yellow-500" /> Lưu ý
                </h2>
                <ul className="text-sm text-blue-800 space-y-2 list-disc pl-5">
                  <li>SKU phải là duy nhất trong hệ thống</li>
                  <li>Mức tồn tối thiểu dùng để cảnh báo sắp hết</li>
                  <li>Giá nhập tính lợi nhuận trong báo cáo</li>
                  <li>Ảnh rõ giúp nhận biết nhanh khi bán hàng</li>
                </ul>
              </div>
              
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white rounded-b-2xl shrink-0 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="flex items-center gap-2 px-6 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium transition-colors"
          >
            Hủy
          </button>
          <button 
            type="button" 
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> Lưu sản phẩm
          </button>
        </div>

      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-full">
            <div className="p-6 overflow-y-auto">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4 mx-auto shrink-0">
                <Lightbulb className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
                {isEdit ? 'Xác nhận thay đổi' : 'Xác nhận thêm sản phẩm'}
              </h3>
              <p className="text-slate-500 text-center text-sm mb-6">
                {isEdit 
                  ? 'Bạn sắp lưu các thay đổi cho sản phẩm này.' 
                  : 'Bạn có chắc chắn muốn thêm sản phẩm này vào hệ thống không?'}
              </p>

              {isEdit ? (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 text-left">
                  <div>
                    <div className="text-xs text-slate-500 font-medium mb-1">Thông tin chính:</div>
                    <ul className="text-sm text-slate-900 space-y-1">
                      <li className="truncate">- <span className="text-slate-500">Tên sản phẩm:</span> <span className="font-medium">{dataToSave?.product_name}</span></li>
                      <li className="truncate">- <span className="text-slate-500">SKU:</span> <span className="font-medium">{dataToSave?.sku}</span></li>
                    </ul>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-200">
                    <div className="text-xs text-slate-500 font-medium mb-1">Các thay đổi:</div>
                    <ul className="text-sm text-slate-900 space-y-1">
                      {calculatedChanges.slice(0, 5).map((c, i) => (
                        <li key={i} className="truncate">
                          - <span className="text-slate-500">{c.label}:</span> {c.oldVal} <span className="text-slate-400 mx-1">→</span> <span className="font-semibold text-blue-600">{c.newVal}</span>
                        </li>
                      ))}
                    </ul>
                    {calculatedChanges.length > 5 && (
                      <div className="text-xs text-slate-500 italic mt-2">
                        + {calculatedChanges.length - 5} thay đổi khác
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 text-left">
                  <div className="text-xs text-slate-500 font-medium mb-2">Thông tin sản phẩm:</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Tên sản phẩm:</span>
                      <span className="font-semibold text-slate-900 text-right line-clamp-1 ml-4" title={dataToSave?.product_name}>{dataToSave?.product_name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">SKU:</span>
                      <span className="font-semibold text-slate-900">{dataToSave?.sku}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Danh mục:</span>
                      <span className="font-semibold text-slate-900">{dataToSave?.category_name || 'Chưa có'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Đơn vị tính:</span>
                      <span className="font-semibold text-slate-900">{dataToSave?.unit_name || 'Chưa có'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Nhà cung cấp:</span>
                      <span className="font-semibold text-slate-900 text-right line-clamp-1 ml-4" title={dataToSave?.supplier_name}>{dataToSave?.supplier_name || 'Chưa có'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Giá nhập:</span>
                      <span className="font-semibold text-slate-900">{dataToSave?.import_price ? dataToSave.import_price.toLocaleString('vi-VN') + ' đ' : 'Chưa có'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Giá bán:</span>
                      <span className="font-semibold text-slate-900">{dataToSave?.selling_price ? dataToSave.selling_price.toLocaleString('vi-VN') + ' đ' : 'Chưa có'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Tồn kho ban đầu:</span>
                      <span className="font-semibold text-slate-900">{dataToSave?.stock_quantity ?? 'Chưa có'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Mức tồn tối thiểu:</span>
                      <span className="font-semibold text-slate-900">{dataToSave?.reorder_level ?? 'Chưa có'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Đề xuất nhập:</span>
                      <span className="font-semibold text-slate-900">{dataToSave?.reorder_quantity ?? 'Chưa có'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Ngày nhập hàng:</span>
                      <span className="font-semibold text-slate-900">
                        {dataToSave?.date_received 
                          ? (() => {
                              const parts = dataToSave.date_received.split('T')[0].split('-');
                              return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dataToSave.date_received;
                            })()
                          : 'Chưa có'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Ngày hết hạn:</span>
                      <span className="font-semibold text-slate-900">
                        {dataToSave?.expiration_date 
                          ? (() => {
                              const parts = dataToSave.expiration_date.split('T')[0].split('-');
                              return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dataToSave.expiration_date;
                            })()
                          : 'Chưa có'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Vị trí kho:</span>
                      <span className="font-semibold text-slate-900 text-right ml-4 line-clamp-1" title={dataToSave?.warehouse_location}>
                        {dataToSave?.warehouse_location || 'Chưa có'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Trạng thái:</span>
                      <span className="font-semibold text-slate-900">{dataToSave?.status || 'Chưa có'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-slate-50 flex gap-3 justify-end rounded-b-2xl border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : (isEdit ? 'Xác nhận cập nhật' : 'Xác nhận thêm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
