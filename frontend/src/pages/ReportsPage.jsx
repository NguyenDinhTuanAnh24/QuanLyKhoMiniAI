import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { reportService } from '../services/reportService';
import { getCategories } from '../services/categoryService';
import { getSuppliers } from '../services/supplierService';
import { getUser } from '../services/authService';
import ReportFilters from '../components/reports/ReportFilters';
import RevenueTab from '../components/reports/tabs/RevenueTab';
import InventoryTab from '../components/reports/tabs/InventoryTab';
import TopSellingTab from '../components/reports/tabs/TopSellingTab';
import ImportsTab from '../components/reports/tabs/ImportsTab';
import LazyRevealSection from '../components/common/LazyRevealSection';

export default function ReportsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const user = getUser();
  const isWarehouseStaff = user?.role === 'Nhân viên kho';
  const isSalesStaff = user?.role === 'Nhân viên bán hàng';

  const getInitialTab = () => {
    if (isWarehouseStaff) return 'inventory';
    if (isSalesStaff) return 'top-selling';
    return 'revenue';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  
  const [filters, setFilters] = useState({
    dateRange: 'this_month',
    categoryId: '',
    supplierId: ''
  });

  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Data states
  const [revenueData, setRevenueData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [topSellingData, setTopSellingData] = useState(null);
  const [importsData, setImportsData] = useState(null);

  const getDateParams = (range) => {
    const today = new Date();
    let startDate = null;
    let endDate = null;
    
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    switch (range) {
      case 'today':
        startDate = formatDate(today);
        endDate = startDate;
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = formatDate(yesterday);
        endDate = startDate;
        break;
      case 'this_week':
        const firstDayOfWeek = new Date(today);
        const day = firstDayOfWeek.getDay() || 7;
        if (day !== 1) firstDayOfWeek.setHours(-24 * (day - 1));
        startDate = formatDate(firstDayOfWeek);
        endDate = formatDate(today);
        break;
      case 'this_month':
        startDate = formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
        endDate = formatDate(today);
        break;
      case 'last_month':
        startDate = formatDate(new Date(today.getFullYear(), today.getMonth() - 1, 1));
        const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        endDate = formatDate(lastDayOfLastMonth);
        break;
      case 'this_year':
        startDate = formatDate(new Date(today.getFullYear(), 0, 1));
        endDate = formatDate(today);
        break;
      case 'all_time':
      default:
        startDate = null;
        endDate = null;
        break;
    }
    return { startDate, endDate };
  };

  const fetchMasterData = async () => {
    try {
      const [catRes, supRes] = await Promise.all([
        getCategories(),
        getSuppliers()
      ]);
      setCategories(catRes.data || []);
      setSuppliers(supRes.data || []);
    } catch (error) {
      console.error('Error fetching master data:', error);
    }
  };

  const fetchReportData = async (force = false) => {
    // Only fetch if forced or data for active tab is missing
    let shouldFetch = force;
    if (!force) {
      if (activeTab === 'revenue' && !revenueData) shouldFetch = true;
      if (activeTab === 'inventory' && !inventoryData) shouldFetch = true;
      if (activeTab === 'top-selling' && !topSellingData) shouldFetch = true;
      if (activeTab === 'imports' && !importsData) shouldFetch = true;
    }

    if (!shouldFetch) return;

    setLoading(true);
    setError(false);
    try {
      const { startDate, endDate } = getDateParams(filters.dateRange);
      
      const apiFilters = {
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.supplierId && { supplierId: filters.supplierId })
      };

      if (activeTab === 'revenue') {
        const revenue = await reportService.getRevenue(apiFilters);
        setRevenueData(revenue);
      } else if (activeTab === 'inventory') {
        const inventory = await reportService.getInventory({ 
          ...(filters.categoryId && { categoryId: filters.categoryId }),
          ...(filters.supplierId && { supplierId: filters.supplierId }) 
        });
        setInventoryData(inventory);
      } else if (activeTab === 'top-selling') {
        const top = await reportService.getTopSelling({ ...apiFilters, limit: 10 });
        setTopSellingData(top);
      } else if (activeTab === 'imports') {
        const imports = await reportService.getImports(apiFilters);
        setImportsData(imports);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      if (error?.response?.status !== 401 && error?.response?.status !== 403) {
        showToast('Lỗi khi tải dữ liệu báo cáo', 'error');
      }
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleFilter = () => {
    setRevenueData(null);
    setInventoryData(null);
    setTopSellingData(null);
    setImportsData(null);
    fetchReportData(true);
  };

  const handleRefresh = () => {
    setFilters({
      dateRange: 'this_month',
      categoryId: '',
      supplierId: ''
    });
    setRevenueData(null);
    setInventoryData(null);
    setTopSellingData(null);
    setImportsData(null);
    // Let useEffect or subsequent renders handle fetching if needed, 
    // but to be safe we can use a timeout to let state update.
    setTimeout(() => {
      fetchReportData(true);
    }, 0);
  };

  const exportCurrentTab = async () => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const { saveAs } = (await import('file-saver')).default;
      const workbook = new ExcelJS.Workbook();
      const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
      const exportDateFormatted = new Date().toLocaleDateString('vi-VN');

      const addHeaderToSheet = (sheet, title, columnsCount) => {
        sheet.mergeCells(1, 1, 1, columnsCount);
        const titleCell = sheet.getCell(1, 1);
        titleCell.value = title;
        titleCell.font = { name: 'Arial', size: 16, bold: true };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

        sheet.mergeCells(2, 1, 2, columnsCount);
        const dateCell = sheet.getCell(2, 1);
        dateCell.value = `Ngày xuất: ${exportDateFormatted}`;
        dateCell.font = { name: 'Arial', size: 11, italic: true };
        dateCell.alignment = { vertical: 'middle', horizontal: 'center' };
        
        // Return row offset for table headers (row 4)
        return 4;
      };

      if (activeTab === 'revenue') {
        if (!revenueData?.tableData || revenueData.tableData.length === 0) {
          showToast('Không có dữ liệu để xuất', 'warning');
          return;
        }
        showToast('Đang tạo file Excel...', 'info');
        const sheet = workbook.addWorksheet('Doanh thu');
        
        addHeaderToSheet(sheet, 'BÁO CÁO DOANH THU', 6);
        
        sheet.getRow(4).values = ['Ngày', 'Số đơn', 'Doanh thu', 'Giảm giá', 'Doanh thu thuần', 'Lợi nhuận'];
        sheet.getRow(4).font = { bold: true };
        
        sheet.columns = [
          { key: 'date', width: 15 },
          { key: 'orders_count', width: 10 },
          { key: 'revenue', width: 20 },
          { key: 'discount', width: 15 },
          { key: 'net_revenue', width: 20 },
          { key: 'profit', width: 20 }
        ];
        
        sheet.getColumn('C').numFmt = '#,##0 "₫"';
        sheet.getColumn('D').numFmt = '#,##0 "₫"';
        sheet.getColumn('E').numFmt = '#,##0 "₫"';
        sheet.getColumn('F').numFmt = '#,##0 "₫"';

        revenueData.tableData.forEach(row => {
          sheet.addRow(row);
        });
        
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `bao_cao_doanh_thu_${dateStr}.xlsx`);
        showToast('Xuất báo cáo thành công', 'success');

      } else if (activeTab === 'inventory') {
        if (!inventoryData?.tableData || inventoryData.tableData.length === 0) {
          showToast('Không có dữ liệu để xuất', 'warning');
          return;
        }
        showToast('Đang tạo file Excel...', 'info');
        const sheet = workbook.addWorksheet('Tồn kho');
        
        addHeaderToSheet(sheet, 'BÁO CÁO TỒN KHO', 8);
        
        sheet.getRow(4).values = ['SKU', 'Sản phẩm', 'Danh mục', 'Tồn kho', 'Mức tồn tối thiểu', 'Giá nhập', 'Giá trị tồn', 'Trạng thái'];
        sheet.getRow(4).font = { bold: true };

        sheet.columns = [
          { key: 'sku', width: 15 },
          { key: 'product_name', width: 30 },
          { key: 'category', width: 20 },
          { key: 'stock_quantity', width: 15 },
          { key: 'reorder_level', width: 20 },
          { key: 'import_price', width: 15 },
          { key: 'inventory_value', width: 20 },
          { key: 'status', width: 15 }
        ];

        sheet.getColumn('F').numFmt = '#,##0 "₫"';
        sheet.getColumn('G').numFmt = '#,##0 "₫"';

        inventoryData.tableData.forEach(row => {
          sheet.addRow(row);
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `bao_cao_ton_kho_${dateStr}.xlsx`);
        showToast('Xuất báo cáo thành công', 'success');

      } else if (activeTab === 'top-selling') {
        if (!topSellingData?.tableData || topSellingData.tableData.length === 0) {
          showToast('Không có dữ liệu để xuất', 'warning');
          return;
        }
        showToast('Đang tạo file Excel...', 'info');
        const sheet = workbook.addWorksheet('Bán chạy');
        
        addHeaderToSheet(sheet, 'BÁO CÁO SẢN PHẨM BÁN CHẠY', 7);
        
        sheet.getRow(4).values = ['STT', 'Sản phẩm', 'Mã SKU', 'Danh mục', 'Số lượng bán', 'Doanh thu', 'Tỷ trọng (%)'];
        sheet.getRow(4).font = { bold: true };

        sheet.columns = [
          { key: 'rank', width: 10 },
          { key: 'product_name', width: 30 },
          { key: 'sku', width: 15 },
          { key: 'category', width: 20 },
          { key: 'sold_quantity', width: 15 },
          { key: 'revenue', width: 20 },
          { key: 'percentage', width: 15 }
        ];

        sheet.getColumn('F').numFmt = '#,##0 "₫"';
        sheet.getColumn('G').numFmt = '0.00 "%"';

        topSellingData.tableData.forEach(row => {
          sheet.addRow(row);
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `bao_cao_san_pham_ban_chay_${dateStr}.xlsx`);
        showToast('Xuất báo cáo thành công', 'success');

      } else if (activeTab === 'imports') {
        if (!importsData?.tableData || importsData.tableData.length === 0) {
          showToast('Không có dữ liệu để xuất', 'warning');
          return;
        }
        showToast('Đang tạo file Excel...', 'info');
        const sheet = workbook.addWorksheet('Nhập hàng');
        
        addHeaderToSheet(sheet, 'BÁO CÁO NHẬP HÀNG', 7);
        
        sheet.getRow(4).values = ['Thời gian', 'Sản phẩm', 'Nhà cung cấp', 'Số lượng', 'Giá nhập', 'Thành tiền', 'Ghi chú'];
        sheet.getRow(4).font = { bold: true };

        sheet.columns = [
          { key: 'date', width: 20 },
          { key: 'product_name', width: 30 },
          { key: 'supplier', width: 25 },
          { key: 'quantity', width: 15 },
          { key: 'unit_price', width: 15 },
          { key: 'total', width: 20 },
          { key: 'note', width: 25 }
        ];
        
        sheet.getColumn('E').numFmt = '#,##0 "₫"';
        sheet.getColumn('F').numFmt = '#,##0 "₫"';

        importsData.tableData.forEach(row => {
          sheet.addRow(row);
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `bao_cao_nhap_hang_${dateStr}.xlsx`);
        showToast('Xuất báo cáo thành công', 'success');
      }
    } catch (error) {
      console.error('Lỗi export excel:', error);
      showToast('Lỗi khi xuất file Excel', 'error');
    }
  };

  const allTabs = [
    { id: 'revenue', label: 'Doanh thu', allowWarehouse: false, allowSales: false },
    { id: 'inventory', label: 'Tồn kho', allowWarehouse: true, allowSales: true },
    { id: 'top-selling', label: 'Sản phẩm bán chạy', allowWarehouse: false, allowSales: true },
    { id: 'imports', label: 'Nhập hàng', allowWarehouse: true, allowSales: false }
  ];

  const tabs = allTabs.filter(tab => {
    if (isWarehouseStaff && !tab.allowWarehouse) return false;
    if (isSalesStaff && !tab.allowSales) return false;
    return true;
  });

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Báo cáo</h1>
          <p className="text-slate-500 mt-1">Theo dõi hiệu quả kinh doanh và tình trạng tồn kho</p>
        </div>
      </div>

      <ReportFilters 
        filters={filters}
        setFilters={setFilters}
        categories={categories}
        suppliers={suppliers}
        onFilter={handleFilter}
        onRefresh={handleRefresh}
        onExport={exportCurrentTab}
        loading={loading}
      />

      {/* Tabs Navigation */}
      <div className="flex space-x-2 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {error && !loading ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="text-red-500 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Không thể tải dữ liệu báo cáo. Vui lòng kiểm tra backend.</h3>
            <p className="text-slate-500 text-sm">Có thể server chưa khởi động hoặc gặp sự cố kết nối.</p>
            <button 
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <LazyRevealSection minHeight={400} key={activeTab}>
            {activeTab === 'revenue' && <RevenueTab data={revenueData} loading={loading} />}
            {activeTab === 'inventory' && <InventoryTab data={inventoryData} loading={loading} />}
            {activeTab === 'top-selling' && <TopSellingTab data={topSellingData} loading={loading} />}
            {activeTab === 'imports' && <ImportsTab data={importsData} loading={loading} />}
          </LazyRevealSection>
        )}
      </div>
    </div>
  );
}
