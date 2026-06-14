import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const exportProductsToExcel = async (products) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('SanPham');

  // Add titles
  worksheet.addRow(['DANH SÁCH SẢN PHẨM']);
  worksheet.addRow(['Smart Retail Inventory AI']);
  const now = new Date();
  const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  worksheet.addRow([`Ngày xuất: ${dateStr}`]);
  worksheet.addRow([]); // Empty row

  // Merge titles
  worksheet.mergeCells('A1:R1');
  worksheet.mergeCells('A2:R2');
  worksheet.mergeCells('A3:R3');
  
  // Style titles
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A2').font = { size: 12, italic: true, color: { argb: 'FF64748B' } };
  worksheet.getCell('A3').font = { size: 11, italic: true, color: { argb: 'FF64748B' } };

  // Define headers
  const headers = [
    'STT', 'Mã SP', 'SKU', 'Tên sản phẩm', 'Tên tiếng Anh', 'Danh mục', 'ĐVT', 'Nhà cung cấp', 
    'Giá nhập', 'Giá bán', 'Tồn kho', 'Mức tối thiểu', 'Đề xuất nhập', 'Ngày nhập', 'Ngày hết hạn', 
    'Vị trí', 'Trạng thái', 'Tình trạng kho'
  ];
  const headerRow = worksheet.addRow(headers);
  
  // Style headers
  headerRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }; // Blue-600
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
  });
  
  // Add data
  products.forEach((p, index) => {
    const stock = p.stock_quantity || 0;
    const reorder = p.reorder_level || 0;
    let stockStatus = 'Ổn định';
    if (stock <= 0) stockStatus = 'Hết hàng';
    else if (stock > 0 && stock <= reorder) stockStatus = 'Cần nhập';

    const row = worksheet.addRow([
      index + 1,
      p.product_id,
      p.sku,
      p.product_name,
      p.product_name_en || '',
      p.category_name || (p.category?.category_name || ''),
      p.unit_name || (p.unit?.unit_name || ''),
      p.supplier_name || (p.supplier?.supplier_name || ''),
      p.import_price || 0,
      p.selling_price || 0,
      stock,
      reorder,
      p.reorder_quantity || 0,
      p.date_received || '',
      p.expiration_date || '',
      p.warehouse_location || '',
      p.status || 'Đang bán',
      stockStatus
    ]);

    // Border and align
    row.eachCell((cell, colNum) => {
      cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      if ([1, 11, 12, 13].includes(colNum)) cell.alignment = { horizontal: 'center' };
      if ([9, 10].includes(colNum)) {
        cell.alignment = { horizontal: 'right' };
        cell.numFmt = '#,##0" đ"';
      }
    });

    // Color code stock status
    const stockCell = row.getCell(18);
    if (stockStatus === 'Hết hàng') {
      stockCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // red-50
      stockCell.font = { color: { argb: 'FFDC2626' } }; // red-600
    } else if (stockStatus === 'Cần nhập') {
      stockCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } }; // amber-50
      stockCell.font = { color: { argb: 'FFD97706' } }; // amber-600
    } else {
      stockCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } }; // green-50
      stockCell.font = { color: { argb: 'FF16A34A' } }; // green-600
    }
  });

  // Auto-fit columns
  worksheet.columns.forEach((column, i) => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell, rowNum) => {
      if (rowNum > 4) { // Ignore titles
        const val = cell.value ? cell.value.toString() : '';
        if (val.length > maxLength) maxLength = val.length;
      }
    });
    // Header length
    const headerLen = headers[i]?.length || 10;
    column.width = Math.max(maxLength, headerLen) + 2;
  });

  // Freeze header and enable auto filter
  worksheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 5 }
  ];
  worksheet.autoFilter = `A5:R${products.length + 5}`;

  // Save File
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const filenameDate = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}`;
  saveAs(blob, `danh_sach_san_pham_${filenameDate}.xlsx`);
};

export const parseExcelFile = async (file) => {
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);
  
  const worksheet = workbook.worksheets[0];
  const data = [];
  let headers = [];
  
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      // Clean headers from * marks
      headers = row.values.map(v => v ? v.toString().replace('*', '').trim() : '');
    } else {
      const rowData = {};
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = headers[colNumber];
        if (header) {
          // Extract text if it's a rich text cell or hyperlink
          let val = cell.value;
          if (val && typeof val === 'object' && val.richText) {
            val = val.richText.map(rt => rt.text).join('');
          } else if (val && typeof val === 'object' && val.text) {
            val = val.text;
          }
          rowData[header] = val;
        }
      });
      data.push(rowData);
    }
  });
  
  return data;
};

export const downloadTemplate = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('SanPham');

  const headers = [
    'SKU*', 'Tên sản phẩm*', 'Tên tiếng Anh', 'Danh mục*', 'ĐVT*', 'Nhà cung cấp*', 
    'Giá nhập*', 'Giá bán*', 'Tồn kho*', 'Mức tối thiểu', 'Đề xuất nhập', 'Ngày nhập (YYYY-MM-DD)', 
    'Ngày hết hạn (YYYY-MM-DD)', 'Vị trí', 'Trạng thái'
  ];
  const headerRow = worksheet.addRow(headers);
  
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  worksheet.addRow([
    'DEMO-001', 'Sản phẩm mẫu', 'Demo Product', 'Hải sản', 'kg', 'Công ty TNHH Hải Sản',
    100000, 150000, 50, 10, 0, '2026-06-10', '', 'Kệ A1', 'Đang bán'
  ]);

  worksheet.columns.forEach(column => column.width = 22);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, 'mau_nhap_san_pham.xlsx');
};
