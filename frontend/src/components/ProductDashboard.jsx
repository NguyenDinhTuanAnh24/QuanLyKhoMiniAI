import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Filter, Upload, Download, MoreHorizontal, LayoutGrid, List, Package, CheckCircle2, AlertTriangle, DollarSign, Eye, Pencil, Trash2, X, RefreshCw, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { getProducts, deleteProduct, createProduct, getProductStats } from '../services/productService';
import { getCategories } from '../services/categoryService';
import { getUnits } from '../services/unitService';
import { getSuppliers } from '../services/supplierService';
import { exportProductsToExcel, parseExcelFile, downloadTemplate } from '../utils/excelUtils';
import StatCard from './StatCard';
import ProductFormModal from './ProductFormPage';
import { useToast } from '../contexts/ToastContext';
import PageContainer from './layout/PageContainer';
import ProductSkeleton from './skeletons/ProductSkeleton';

export default function ProductDashboard({ onNavigate }) {
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  
  // Confirm Delete state
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Import states
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importData, setImportData] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = React.useRef(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedStockStatus, setSelectedStockStatus] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  
  // Local pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selection states
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const selectAllRef = React.useRef(null);

  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    totalInventoryValue: 0
  });
  const [categoryList, setCategoryList] = useState([]);

  const initData = async () => {
    try {
      const [catRes, statsRes] = await Promise.all([
        getCategories(),
        getProductStats()
      ]);
      if (catRes.data) setCategoryList(catRes.data);
      if (statsRes.data) setStats(statsRes.data);
    } catch (e) {
      console.error('Lỗi tải data ban đầu:', e);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = { 
        limit: itemsPerPage, 
        page: currentPage,
        search: debouncedSearch,
        category_id: selectedCategory,
        status: selectedStatus,
        stock_status: selectedStockStatus
      };
      const result = await getProducts(params);
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

  useEffect(() => {
    loadProducts();
  }, [currentPage, debouncedSearch, selectedCategory, selectedStatus, selectedStockStatus]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Checkbox logic
  const visibleProductIds = products.map((p) => p.product_id);

  const isAllVisibleSelected =
    visibleProductIds.length > 0 &&
    visibleProductIds.every((id) => selectedProductIds.includes(id));

  const isSomeVisibleSelected =
    visibleProductIds.some((id) => selectedProductIds.includes(id)) &&
    !isAllVisibleSelected;

  const handleToggleSelectAllVisible = () => {
    if (isAllVisibleSelected) {
      setSelectedProductIds((prev) =>
        prev.filter((id) => !visibleProductIds.includes(id))
      );
    } else {
      setSelectedProductIds((prev) => {
        const next = new Set(prev);
        visibleProductIds.forEach((id) => next.add(id));
        return Array.from(next);
      });
    }
  };

  const handleToggleSelectProduct = (productId) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isSomeVisibleSelected;
    }
  }, [isSomeVisibleSelected]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedCategory('');
    setSelectedStatus('');
    setSelectedStockStatus('');
    setCurrentPage(1);
  };

  const handleAddClick = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleViewClick = (product) => {
    setViewingProduct(product);
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    loadProducts(); // refresh list
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete.product_id);
      showToast({
        type: "success",
        title: "Thành công",
        message: "Xóa sản phẩm thành công"
      });
      setProductToDelete(null);
      loadProducts();
    } catch (error) {
      console.error(error);
      showToast({
        type: "error",
        title: "Lỗi",
        message: "Không thể xóa sản phẩm."
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportClick = async () => {
    try {
      if (products.length === 0) {
        showToast({ type: 'warning', title: 'Cảnh báo', message: 'Không có dữ liệu để xuất' });
        return;
      }
      // Temporarily fetch all for export since we only have current page
      const res = await getProducts({ limit: 10000, search: debouncedSearch, category_id: selectedCategory, status: selectedStatus });
      await exportProductsToExcel(res.data || []);
      showToast({ type: 'success', title: 'Thành công', message: 'Xuất Excel thành công' });
    } catch (error) {
      console.error(error);
      showToast({ type: 'error', title: 'Lỗi', message: 'Không thể xuất Excel' });
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      showToast({ type: 'error', title: 'Lỗi', message: 'File không đúng định dạng Excel' });
      e.target.value = '';
      return;
    }

    try {
      const data = await parseExcelFile(file);
      await processImportData(data);
      e.target.value = '';
    } catch (error) {
      console.error(error);
      showToast({ type: 'error', title: 'Lỗi', message: 'File có dữ liệu lỗi, vui lòng kiểm tra lại.' });
      e.target.value = '';
    }
  };

  const processImportData = async (data) => {
    try {
      const [catRes, unitRes, supRes] = await Promise.all([
        getCategories(), getUnits(), getSuppliers()
      ]);
      const categoryMap = new Map((catRes.data || []).map(c => [c.category_name.toLowerCase(), c.category_id]));
      const unitMap = new Map((unitRes.data || []).map(u => [u.unit_name.toLowerCase(), u.unit_id]));
      const supMap = new Map((supRes.data || []).map(s => [s.supplier_name.toLowerCase(), s.supplier_id]));
      const skuSet = new Set(products.map(p => p.sku.toLowerCase()));

      const processedData = [];
      const errors = [];

      data.forEach((row, index) => {
        const rowNum = index + 2; // +1 for 0-index, +1 for header
        const sku = row['SKU']?.toString().trim();
        const name = row['Tên sản phẩm']?.toString().trim();
        const catName = row['Danh mục']?.toString().trim();
        const unitName = row['ĐVT']?.toString().trim();
        const supName = row['Nhà cung cấp']?.toString().trim();
        const importPrice = parseFloat(row['Giá nhập']);
        const sellingPrice = parseFloat(row['Giá bán']);
        const stock = parseInt(row['Tồn kho'], 10);
        const reorderLevel = parseInt(row['Mức tối thiểu'], 10) || 0;
        const reorderQty = parseInt(row['Đề xuất nhập'], 10) || 0;
        
        let rowError = null;

        if (!sku) rowError = 'SKU bị trống';
        else if (!name) rowError = 'Tên sản phẩm bị trống';
        else if (!catName) rowError = 'Danh mục bị trống';
        else if (!unitName) rowError = 'ĐVT bị trống';
        else if (!supName) rowError = 'Nhà cung cấp bị trống';
        else if (isNaN(importPrice) || importPrice < 0) rowError = 'Giá nhập không hợp lệ';
        else if (isNaN(sellingPrice) || sellingPrice < 0) rowError = 'Giá bán không hợp lệ';
        else if (isNaN(stock) || stock < 0) rowError = 'Tồn kho không hợp lệ';
        else if (skuSet.has(sku.toLowerCase())) rowError = `SKU ${sku} đã tồn tại`;
        else if (!categoryMap.has(catName.toLowerCase())) rowError = `Không tìm thấy danh mục: ${catName}`;
        else if (!unitMap.has(unitName.toLowerCase())) rowError = `Không tìm thấy ĐVT: ${unitName}`;
        else if (!supMap.has(supName.toLowerCase())) rowError = `Không tìm thấy Nhà cung cấp: ${supName}`;

        if (rowError) {
          errors.push(`Dòng ${rowNum}: ${rowError}`);
        } else {
          processedData.push({
            sku,
            product_name: name,
            product_name_en: row['Tên tiếng Anh']?.toString() || null,
            category_id: categoryMap.get(catName.toLowerCase()),
            unit_id: unitMap.get(unitName.toLowerCase()),
            supplier_id: supMap.get(supName.toLowerCase()),
            import_price: importPrice,
            selling_price: sellingPrice,
            stock_quantity: stock,
            reorder_level: reorderLevel,
            reorder_quantity: reorderQty,
            date_received: row['Ngày nhập (YYYY-MM-DD)']?.toString() || null,
            expiration_date: row['Ngày hết hạn (YYYY-MM-DD)']?.toString() || null,
            warehouse_location: row['Vị trí']?.toString() || null,
            status: row['Trạng thái']?.toString() || 'Đang bán'
          });
          skuSet.add(sku.toLowerCase());
        }
      });

      setImportData(processedData);
      setImportErrors(errors);
      setImportModalOpen(true);
    } catch (error) {
      console.error(error);
      showToast({ type: 'error', title: 'Lỗi', message: 'Không thể xử lý dữ liệu Excel' });
    }
  };

  const handleConfirmImport = async () => {
    setIsImporting(true);
    try {
      for (const product of importData) {
        await createProduct(product);
      }
      showToast({ type: 'success', title: 'Thành công', message: 'Nhập Excel thành công' });
      setImportModalOpen(false);
      loadProducts();
    } catch (error) {
      console.error(error);
      showToast({ type: 'error', title: 'Lỗi', message: 'Không thể nhập Excel. Vui lòng kiểm tra lại file.' });
    } finally {
      setIsImporting(false);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  const formatCompactCurrency = (val) => {
    if (!val) return 'đ 0';
    if (val >= 1e9) return `đ ${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `đ ${(val / 1e6).toFixed(1)}M`;
    return formatCurrency(val);
  };

  const getProductBadge = (product) => {
    const stock = product.stock_quantity || 0;
    const reorder = product.reorder_level || 0;
    const statusStr = product.status?.toLowerCase() || '';

    if (stock === 0) return { text: 'Hết hàng', class: 'bg-red-50 text-red-700 border-red-200' };
    if (stock <= reorder) return { text: 'Cần nhập', class: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (statusStr.includes('ngừng') || statusStr.includes('ngưng') || statusStr === 'inactive') {
      return { text: 'Tạm ngừng', class: 'bg-slate-100 text-slate-600 border-slate-200' };
    }
    return { text: 'Đang bán', class: 'bg-green-50 text-green-700 border-green-200' };
  };

  const renderProductCard = (product) => {
    const badge = getProductBadge(product);
    const isLowStock = product.stock_quantity <= (product.reorder_level || 0);
    
    return (
      <div key={product.product_id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
        <div className="h-32 bg-slate-100 flex items-center justify-center shrink-0 relative overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt={product.product_name} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-10 h-10 text-slate-300" />
          )}
          <div className="absolute top-2 right-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border shadow-sm bg-white/90 backdrop-blur-sm ${badge.class.replace('bg-', 'text-').replace('text-', 'text-')}`}>
              {badge.text}
            </span>
          </div>
        </div>
        <div className="p-4 flex flex-col flex-1">
          <div className="text-xs font-medium text-slate-500 mb-1">{product.category_name || product.category?.category_name || 'N/A'}</div>
          <div className="font-bold text-slate-900 text-sm line-clamp-2 leading-tight mb-2 flex-1" title={product.product_name}>
            {product.product_name}
          </div>
          <div className="flex items-end justify-between mt-auto pt-2 border-t border-slate-100">
            <div>
              <div className="text-xs text-slate-500 mb-0.5">Giá bán</div>
              <div className="font-bold text-slate-900">{formatCurrency(product.selling_price)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 mb-0.5">Tồn kho</div>
              <div className={`font-bold ${isLowStock ? 'text-red-600' : 'text-slate-700'}`}>
                {product.stock_quantity || 0}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 px-3 py-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">{product.sku}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => handleViewClick(product)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Xem">
              <Eye className="w-4 h-4" />
            </button>
            <button onClick={() => handleEditClick(product)} className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors" title="Sửa">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={() => handleDeleteClick(product)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors" title="Xóa">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading && products.length === 0 && !searchTerm && !selectedCategory && !selectedStatus && !selectedStockStatus) {
    return (
      <PageContainer>
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Sản phẩm</h1>
            <p className="text-slate-500 text-sm mt-1">Quản lý toàn bộ sản phẩm trong hệ thống</p>
          </div>
        </div>
        <ProductSkeleton />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sản phẩm</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý toàn bộ sản phẩm trong hệ thống</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".xlsx, .xls" 
            className="hidden" 
          />
          <button onClick={handleImportClick} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors shadow-sm">
            <Upload className="w-4 h-4" />
            Nhập Excel
          </button>
          <button onClick={handleExportClick} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Xuất Excel
          </button>
          <button onClick={handleAddClick} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} iconColorClass="bg-blue-50 text-blue-600" label="Tổng sản phẩm" value={stats.totalProducts} trend="up" trendLabel="+4 mới" />
        <StatCard icon={CheckCircle2} iconColorClass="bg-green-50 text-green-600" label="Đang bán" value={stats.activeProducts} trend="up" trendLabel="91%" />
        <StatCard icon={AlertTriangle} iconColorClass="bg-amber-50 text-amber-600" label="Cần nhập" value={stats.lowStockProducts} trend="down" trendLabel="9%" />
        <StatCard icon={DollarSign} iconColorClass="bg-blue-50 text-blue-600" label="Tổng giá trị" value={formatCompactCurrency(stats.totalInventoryValue)} trend="up" trendLabel="+5.2%" />
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-2 items-center">
        <div className="relative flex-1 w-full md:w-auto md:max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm theo tên, SKU..."
            className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">Tất cả danh mục</option>
          {categoryList.map(cat => (
            <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
          ))}
        </select>
        
        <select 
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="Đang bán">Đang bán</option>
          <option value="Tạm ngưng">Tạm ngưng</option>
        </select>

        <select 
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
          value={selectedStockStatus}
          onChange={(e) => setSelectedStockStatus(e.target.value)}
        >
          <option value="">Tất cả tình trạng kho</option>
          <option value="in">Còn hàng</option>
          <option value="low">Sắp hết hàng</option>
          <option value="out">Hết hàng</option>
        </select>

        {(searchTerm || selectedCategory || selectedStatus || selectedStockStatus) && (
          <button 
            onClick={handleResetFilters}
            className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap"
            title="Đặt lại bộ lọc"
          >
            <RefreshCw className="w-4 h-4" /> Đặt lại
          </button>
        )}

        <div className="flex-1 hidden md:block"></div>

        <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
          <button 
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {products.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">Không tìm thấy sản phẩm phù hợp</h3>
            <p className="text-slate-500 text-sm">Vui lòng thử thay đổi điều kiện lọc hoặc từ khóa tìm kiếm.</p>
            <button onClick={handleResetFilters} className="mt-4 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
              Xóa bộ lọc
            </button>
          </div>
        ) : viewMode === 'list' ? (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    <th className="p-4 w-12 text-center">
                      <input 
                        type="checkbox" 
                        ref={selectAllRef}
                        checked={isAllVisibleSelected}
                        onChange={handleToggleSelectAllVisible}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                      />
                    </th>
                    <th className="p-4">Sản phẩm</th>
                    <th className="p-4">SKU</th>
                    <th className="p-4">Danh mục</th>
                    <th className="p-4 text-right">Giá nhập</th>
                    <th className="p-4 text-right">Giá bán</th>
                    <th className="p-4 text-center">Tồn kho</th>
                    <th className="p-4 text-center">Trạng thái</th>
                    <th className="p-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {products.map(product => {
                    const badge = getProductBadge(product);
                    const isLowStock = product.stock_quantity <= (product.reorder_level || 0);

                    return (
                      <tr key={product.product_id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4 text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedProductIds.includes(product.product_id)}
                            onChange={() => handleToggleSelectProduct(product.product_id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 overflow-hidden">
                              {product.image_url ? (
                                <img src={product.image_url} alt={product.product_name} className="w-full h-full object-cover" />
                              ) : (
                                <List className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                                {product.product_name}
                              </div>
                              <div className="text-xs text-slate-500">{product.category_name || product.category?.category_name || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600">{product.sku}</td>
                        <td className="p-4 text-slate-600">{product.category_name || product.category?.category_name || 'N/A'}</td>
                        <td className="p-4 text-right text-slate-600 font-medium">{formatCurrency(product.import_price)}</td>
                        <td className="p-4 text-right text-slate-900 font-medium">{formatCurrency(product.selling_price)}</td>
                        <td className="p-4 text-center">
                          <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-slate-700'}`}>
                            {product.stock_quantity || 0}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${badge.class}`}>
                            {badge.text}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-3 text-sm">
                            <button onClick={() => handleViewClick(product)} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors font-medium">
                              <Eye className="w-4 h-4" /> Xem
                            </button>
                            <button onClick={() => handleEditClick(product)} className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors font-medium">
                              <Pencil className="w-4 h-4" /> Sửa
                            </button>
                            <button onClick={() => handleDeleteClick(product)} className="flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors font-medium">
                              <Trash2 className="w-4 h-4" /> Xoá
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Mobile Card List */}
            <div className="md:hidden p-4 grid grid-cols-1 gap-4 bg-slate-50">
              {products.map(product => renderProductCard(product))}
            </div>
          </>
        ) : (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 bg-slate-50">
            {products.map(product => renderProductCard(product))}
          </div>
        )}
        
        {/* Pagination Footer */}
        {products.length > 0 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
            <div className="text-sm text-slate-500">
              Hiển thị <span className="font-medium text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> đến <span className="font-medium text-slate-900">{Math.min(currentPage * itemsPerPage, totalItems)}</span> trong tổng số <span className="font-medium text-slate-900">{totalItems}</span> sản phẩm
            </div>
            {totalPages > 1 && (
              <div className="flex gap-1">
                <button 
                  className="px-3 py-1 border border-slate-200 bg-white text-slate-600 rounded hover:bg-slate-50 disabled:opacity-50 text-sm font-medium transition-colors"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  Trước
                </button>
                <div className="px-3 py-1 text-sm font-medium text-slate-600">
                  {currentPage} / {totalPages}
                </div>
                <button 
                  className="px-3 py-1 border border-slate-200 bg-white text-slate-600 rounded hover:bg-slate-50 disabled:opacity-50 text-sm font-medium transition-colors"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {isModalOpen && (
        <ProductFormModal 
          payload={{ product: editingProduct }} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={handleModalSuccess} 
        />
      )}

      {/* View Details Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-50 w-full max-w-4xl rounded-2xl shadow-xl flex flex-col max-h-full my-auto">
            <div className="px-6 py-4 border-b border-slate-200 bg-white rounded-t-2xl flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold text-slate-900">Chi tiết sản phẩm</h2>
              <button onClick={() => setViewingProduct(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3 lg:w-1/4 shrink-0">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center aspect-square overflow-hidden relative">
                    {viewingProduct.image_url ? (
                      <img src={viewingProduct.image_url} alt={viewingProduct.product_name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Package className="w-20 h-20 text-slate-300" />
                    )}
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Thông tin cơ bản</h3>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="text-slate-500">Tên sản phẩm:</span>
                      <span className="font-medium text-slate-900 text-right">{viewingProduct.product_name || 'Chưa có'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="text-slate-500">Tên tiếng Anh:</span>
                      <span className="font-medium text-slate-900 text-right">{viewingProduct.product_name_en || 'Chưa có'}</span>
                    </div>
                    <div className="flex justify-between gap-1">
                      <span className="text-slate-500">SKU:</span>
                      <span className="font-medium text-slate-900">{viewingProduct.sku || 'Chưa có'}</span>
                    </div>
                    <div className="flex justify-between gap-1">
                      <span className="text-slate-500">Danh mục:</span>
                      <span className="font-medium text-slate-900">{viewingProduct.category_name || viewingProduct.category?.category_name || 'Chưa có'}</span>
                    </div>
                    <div className="flex justify-between gap-1">
                      <span className="text-slate-500">Đơn vị tính:</span>
                      <span className="font-medium text-slate-900">{viewingProduct.unit_name || viewingProduct.unit?.unit_name || 'Chưa có'}</span>
                    </div>
                    <div className="flex justify-between gap-1">
                      <span className="text-slate-500">Nhà cung cấp:</span>
                      <span className="font-medium text-slate-900 text-right">{viewingProduct.supplier_name || viewingProduct.supplier?.supplier_name || 'Chưa có'}</span>
                    </div>
                    <div className="flex justify-between gap-1">
                      <span className="text-slate-500">Trạng thái:</span>
                      <span className="font-medium text-slate-900">{viewingProduct.status || 'Chưa có'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Giá và tồn kho</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between gap-1">
                      <span className="text-slate-500">Giá nhập:</span>
                      <span className="font-medium text-slate-900">{viewingProduct.import_price ? viewingProduct.import_price.toLocaleString('vi-VN') + ' đ' : 'Chưa có'}</span>
                    </div>
                    <div className="flex justify-between gap-1">
                      <span className="text-slate-500">Giá bán:</span>
                      <span className="font-medium text-slate-900">{viewingProduct.selling_price ? viewingProduct.selling_price.toLocaleString('vi-VN') + ' đ' : 'Chưa có'}</span>
                    </div>
                    <div className="flex justify-between gap-1">
                      <span className="text-slate-500">Số lượng tồn kho:</span>
                      <span className="font-medium text-slate-900">{viewingProduct.stock_quantity ?? 'Chưa có'}</span>
                    </div>
                    <div className="flex justify-between gap-1">
                      <span className="text-slate-500">Mức tồn tối thiểu:</span>
                      <span className="font-medium text-slate-900">{viewingProduct.reorder_level ?? 'Chưa có'}</span>
                    </div>
                    <div className="flex justify-between gap-1">
                      <span className="text-slate-500">Đề xuất nhập:</span>
                      <span className="font-medium text-slate-900">{viewingProduct.reorder_quantity ?? 'Chưa có'}</span>
                    </div>
                    <div className="flex justify-between gap-1">
                      <span className="text-slate-500">Tình trạng kho:</span>
                      <span className="font-medium text-slate-900">
                        {(() => {
                          const stock = viewingProduct.stock_quantity || 0;
                          const reorder = viewingProduct.reorder_level || 0;
                          if (stock <= 0) return 'Hết hàng';
                          if (stock <= reorder) return 'Cần nhập';
                          return 'Đủ hàng';
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Thông tin kho</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between gap-1">
                      <span className="text-slate-500">Ngày nhập hàng:</span>
                      <span className="font-medium text-slate-900">
                        {viewingProduct.date_received 
                          ? (() => {
                              const parts = viewingProduct.date_received.split('T')[0].split('-');
                              return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : viewingProduct.date_received;
                            })()
                          : 'Chưa có'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-1">
                      <span className="text-slate-500">Ngày hết hạn:</span>
                      <span className="font-medium text-slate-900">
                        {viewingProduct.expiration_date 
                          ? (() => {
                              const parts = viewingProduct.expiration_date.split('T')[0].split('-');
                              return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : viewingProduct.expiration_date;
                            })()
                          : 'Chưa có'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-1">
                      <span className="text-slate-500">Vị trí kho:</span>
                      <span className="font-medium text-slate-900 text-right">{viewingProduct.warehouse_location || 'Chưa có'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">Dữ liệu phân tích</h3>
                  
                  {(() => {
                    const sales90 = Number(viewingProduct.sales_90d) || 0;
                    const avgSales = Number(viewingProduct.avg_daily_sales_90d) || 0;
                    const forecast14 = Number(viewingProduct.forecast_14d) || 0;
                    const suggest = Number(viewingProduct.suggested_import_quantity) || 0;
                    const stock = Number(viewingProduct.stock_quantity) || 0;
                    
                    const unitName = viewingProduct.unit_name || viewingProduct.unit?.unit_name || 'sản phẩm';
                    const hasNoData = sales90 === 0 && avgSales === 0 && forecast14 === 0 && suggest === 0;

                    let aiMessage = '';
                    if (forecast14 > stock) {
                      aiMessage = 'Nhu cầu dự báo đang cao hơn tồn kho hiện tại.';
                    } else if (suggest > 0) {
                      aiMessage = 'AI đề xuất nhập thêm để hạn chế rủi ro thiếu hàng.';
                    } else {
                      aiMessage = 'Tồn kho hiện tại chưa cần nhập bổ sung.';
                    }

                    return (
                      <div className="space-y-3">
                        <div className="flex justify-between gap-1">
                          <span className="text-slate-500">Đã bán trong 90 ngày:</span>
                          <span className="font-medium text-slate-900">{sales90} {unitName}</span>
                        </div>
                        <div className="flex justify-between gap-1">
                          <span className="text-slate-500">Trung bình bán mỗi ngày:</span>
                          <span className="font-medium text-slate-900">{avgSales.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} {unitName}/ngày</span>
                        </div>
                        <div className="flex justify-between gap-1">
                          <span className="text-slate-500">Dự báo nhu cầu 14 ngày tới:</span>
                          <span className="font-bold text-slate-900">{forecast14} {unitName}</span>
                        </div>
                        <div className="flex justify-between gap-1">
                          <span className="text-slate-500">Số lượng AI gợi ý nhập:</span>
                          <span className={`font-bold ${suggest > 0 ? 'text-blue-600' : 'text-slate-900'}`}>
                            {suggest > 0 ? `${suggest} ${unitName}` : 'Chưa cần nhập'}
                          </span>
                        </div>

                        {!hasNoData && (
                          <div className="pt-3 border-t border-slate-100 mt-2">
                            <p className={`text-sm font-medium ${forecast14 > stock ? 'text-amber-600' : (suggest > 0 ? 'text-blue-600' : 'text-green-600')}`}>
                              {aiMessage}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

              {viewingProduct.description && (
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Mô tả sản phẩm</h3>
                  <p className="text-slate-700 whitespace-pre-wrap">{viewingProduct.description}</p>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-slate-200 bg-white rounded-b-2xl shrink-0 flex justify-end gap-3">
              <button 
                onClick={() => setViewingProduct(null)}
                className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium transition-colors"
              >
                Đóng
              </button>
              <button 
                onClick={() => {
                  setViewingProduct(null);
                  handleEditClick(viewingProduct);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" /> Sửa sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4 mx-auto shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Xác nhận xóa sản phẩm</h3>
              <p className="text-slate-500 text-center text-sm mb-6">
                Bạn có chắc chắn muốn xóa sản phẩm này không? Thao tác này sẽ ẩn sản phẩm khỏi danh sách quản lý.
              </p>
              
              <div className="bg-slate-50 rounded-lg p-4 space-y-2 border border-slate-100 mb-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tên sản phẩm:</span>
                  <span className="font-semibold text-slate-900 line-clamp-1 text-right ml-4" title={productToDelete.product_name}>{productToDelete.product_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">SKU:</span>
                  <span className="font-semibold text-slate-900">{productToDelete.sku}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Danh mục:</span>
                  <span className="font-semibold text-slate-900">{productToDelete.category_name || productToDelete.category?.category_name || 'Chưa có'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tồn kho hiện tại:</span>
                  <span className="font-semibold text-slate-900">{productToDelete.stock_quantity ?? 'Chưa có'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Trạng thái:</span>
                  <span className="font-semibold text-slate-900">{productToDelete.status || 'Chưa có'}</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex gap-3 justify-end rounded-b-2xl border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                disabled={isDeleting}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? 'Đang xử lý...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Preview Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Xem trước dữ liệu nhập</h3>
                  <p className="text-sm text-slate-500">Kiểm tra thông tin trước khi ghi vào hệ thống</p>
                </div>
              </div>
              <button onClick={() => setImportModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-sm text-slate-500">Tổng số dòng</div>
                  <div className="text-xl font-bold text-slate-900">{importData.length + importErrors.length}</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                  <div className="text-sm text-green-600">Hợp lệ</div>
                  <div className="text-xl font-bold text-green-700">{importData.length}</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                  <div className="text-sm text-red-600">Lỗi</div>
                  <div className="text-xl font-bold text-red-700">{importErrors.length}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <div className="text-sm text-blue-600">Thêm mới</div>
                  <div className="text-xl font-bold text-blue-700">{importData.length}</div>
                </div>
              </div>

              {importErrors.length > 0 && (
                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                  <div className="flex items-center gap-2 mb-2 text-red-800 font-medium">
                    <AlertCircle className="w-5 h-5" />
                    <span>Danh sách lỗi ({importErrors.length})</span>
                  </div>
                  <ul className="list-disc list-inside text-sm text-red-600 space-y-1 max-h-32 overflow-y-auto bg-white p-3 rounded-lg border border-red-100">
                    {importErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {importData.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Dữ liệu hợp lệ (Preview 5 dòng đầu)</h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="p-3 font-medium text-slate-700">SKU</th>
                          <th className="p-3 font-medium text-slate-700">Tên sản phẩm</th>
                          <th className="p-3 font-medium text-slate-700">Giá nhập</th>
                          <th className="p-3 font-medium text-slate-700">Giá bán</th>
                          <th className="p-3 font-medium text-slate-700">Tồn kho</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {importData.slice(0, 5).map((row, i) => (
                          <tr key={i}>
                            <td className="p-3">{row.sku}</td>
                            <td className="p-3">{row.product_name}</td>
                            <td className="p-3">{formatCurrency(row.import_price)}</td>
                            <td className="p-3">{formatCurrency(row.selling_price)}</td>
                            <td className="p-3">{row.stock_quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white shrink-0">
              <button 
                onClick={() => setImportModalOpen(false)} 
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                disabled={isImporting}
              >
                Hủy
              </button>
              <button 
                onClick={handleConfirmImport} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={isImporting || importData.length === 0 || importErrors.length > 0}
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Xác nhận nhập
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
