import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Lightbulb, ArrowLeft, Save } from 'lucide-react';
import { createProduct, updateProduct } from '../services/productService';
import { getCategories } from '../services/categoryService';
import { getUnits } from '../services/unitService';
import { getSuppliers } from '../services/supplierService';

export default function ProductFormPage({ payload, onNavigate }) {
  const isEdit = !!payload?.product;
  const initialProduct = payload?.product || {};

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

  const validate = () => {
    if (!formData.product_name) return "Tên sản phẩm là bắt buộc.";
    if (!formData.sku) return "Mã SKU là bắt buộc.";
    if (!formData.category_id) return "Vui lòng chọn danh mục.";
    if (!formData.unit_id) return "Vui lòng chọn đơn vị tính.";
    if (!formData.supplier_id) return "Vui lòng chọn nhà cung cấp.";
    if (formData.import_price < 0) return "Giá nhập phải >= 0.";
    if (formData.selling_price < 0) return "Giá bán phải >= 0.";
    if (formData.selling_price < formData.import_price) return "Giá bán không được nhỏ hơn giá nhập.";
    if (formData.stock_quantity < 0) return "Số lượng tồn kho phải >= 0.";
    if (formData.reorder_level < 0) return "Mức tồn tối thiểu phải >= 0.";
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
      return;
    }

    setLoading(true);
    try {
      const dataToSave = { ...formData };
      
      // Map names if needed (backend might map automatically or need them)
      const cat = categories.find(c => c.category_id === formData.category_id);
      if (cat) dataToSave.category_name = cat.category_name;
      
      const unit = units.find(u => u.unit_id === formData.unit_id);
      if (unit) dataToSave.unit_name = unit.unit_name;
      
      // Format dates to null if empty
      if (!dataToSave.date_received) dataToSave.date_received = null;
      if (!dataToSave.expiration_date) dataToSave.expiration_date = null;

      if (isEdit) {
        await updateProduct(initialProduct.product_id, dataToSave);
      } else {
        await createProduct(dataToSave);
      }
      
      alert(isEdit ? "Cập nhật sản phẩm thành công!" : "Thêm sản phẩm thành công!");
      onNavigate('products');
    } catch (error) {
      console.error(error);
      setErrorMsg(error.response?.data?.message || "Đã có lỗi xảy ra khi lưu sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h1>
        <p className="text-slate-500 text-sm mt-1">Điền đầy đủ thông tin sản phẩm vào các trường bên dưới</p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 border border-red-200">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Lõi bên trái: 2/3 màn hình */}
        <div className="lg:col-span-2 space-y-6">
          
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
                  rows="4" 
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

          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button" 
              onClick={() => onNavigate('products')}
              className="flex items-center gap-2 px-6 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Hủy
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {loading ? 'Đang lưu...' : 'Lưu sản phẩm'}
            </button>
          </div>
        </div>

        {/* Cột bên phải: 1/3 màn hình */}
        <div className="space-y-6">
          
          {/* Hình ảnh */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">Hình ảnh sản phẩm</h2>
            <div className="border-2 border-dashed border-blue-200 bg-blue-50 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-100 transition-colors">
              <UploadCloud className="w-10 h-10 text-blue-500 mb-3" />
              <p className="text-sm font-medium text-slate-700">Kéo thả hoặc nhấn để tải ảnh</p>
              <p className="text-xs text-slate-500 mt-1">PNG, JPG tối đa 5MB</p>
            </div>
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
                  value="Tạm ngừng"
                  checked={formData.status === 'Tạm ngừng'}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500" 
                />
                <div>
                  <div className="text-sm font-medium text-slate-900">Tạm ngừng</div>
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
      </form>
    </div>
  );
}
