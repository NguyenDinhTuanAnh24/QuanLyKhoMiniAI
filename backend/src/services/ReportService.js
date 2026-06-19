const ReportRepository = require('../repositories/ReportRepository');

class ReportService {

  async getRevenueReport(filters) {
    const { startDate, endDate, categoryId, supplierId } = filters;
    const orders = await ReportRepository.getOrders(startDate, endDate);
    const orderIds = orders.map(o => o.order_id);
    let orderItems = await ReportRepository.getOrderItems(orderIds);

    orderItems = orderItems.filter(item => !item.product || item.product.deleted_at === null);

    if (categoryId) orderItems = orderItems.filter(item => item.product?.category_id === categoryId);
    if (supplierId) orderItems = orderItems.filter(item => item.product?.supplier_id === supplierId);

    // Aggregate summary
    const summary = {
      total_revenue: 0,
      total_orders: 0,
      avg_order_value: 0,
      estimated_profit: 0
    };

    if (categoryId || supplierId) {
      summary.total_revenue = orderItems.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
      summary.total_orders = new Set(orderItems.map(i => i.order_id)).size;
    } else {
      summary.total_revenue = orders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
      summary.total_orders = orders.length;
    }
    
    if (summary.total_orders > 0) {
      summary.avg_order_value = summary.total_revenue / summary.total_orders;
    }

    summary.estimated_profit = orderItems.reduce((sum, item) => {
      const importPrice = item.product?.import_price || 0;
      return sum + ((Number(item.subtotal) || 0) - (Number(item.quantity) * Number(importPrice)));
    }, 0);

    // Revenue by Date
    const dateMap = {};
    // Details for table
    const tableDataMap = {};

    orders.forEach(order => {
      const date = order.created_at.split('T')[0];
      const itemsInOrder = orderItems.filter(i => i.order_id === order.order_id);
      
      let revenue = 0;
      let profit = 0;
      
      if (categoryId || supplierId) {
        revenue = itemsInOrder.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
      } else {
        revenue = Number(order.total_amount) || 0;
      }

      profit = itemsInOrder.reduce((sum, item) => {
        const importPrice = item.product?.import_price || 0;
        return sum + ((Number(item.subtotal) || 0) - (Number(item.quantity) * Number(importPrice)));
      }, 0);

      // Only count order if it has items after filter
      const isValidOrder = categoryId || supplierId ? itemsInOrder.length > 0 : true;

      if (isValidOrder) {
        dateMap[date] = (dateMap[date] || 0) + revenue;

        if (!tableDataMap[date]) {
          tableDataMap[date] = { date, orders_count: 0, revenue: 0, discount: 0, net_revenue: 0, profit: 0 };
        }
        tableDataMap[date].orders_count += 1;
        tableDataMap[date].revenue += revenue;
        tableDataMap[date].net_revenue += revenue;
        tableDataMap[date].profit += profit;
      }
    });

    const chartData = Object.keys(dateMap).sort().map(date => ({
      date,
      revenue: dateMap[date]
    }));

    // Revenue by Category chart
    const categoryMap = {};
    orderItems.forEach(item => {
      const catName = item.product?.category?.category_name || 'Khác';
      categoryMap[catName] = (categoryMap[catName] || 0) + (Number(item.subtotal) || 0);
    });
    
    const categoryChartData = Object.keys(categoryMap).map(category => ({
      category,
      revenue: categoryMap[category]
    })).sort((a, b) => b.revenue - a.revenue);

    const tableData = Object.values(tableDataMap).sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      summary,
      chartData,
      categoryChartData,
      tableData
    };
  }

  async getInventoryReport(filters) {
    const { categoryId, supplierId } = filters;
    let products = await ReportRepository.getProducts();

    if (categoryId) products = products.filter(p => p.category_id === categoryId);
    if (supplierId) products = products.filter(p => p.supplier_id === supplierId);

    const summary = {
      total_products: products.length,
      inventory_value: 0,
      needs_import: 0,
      out_of_stock: 0
    };

    const categoryMap = {};
    const tableData = [];

    products.forEach(p => {
      const stock = Number(p.stock_quantity) || 0;
      const reorderLevel = Number(p.reorder_level) || 0;
      const importPrice = Number(p.import_price) || 0;
      const value = stock * importPrice;
      const catName = p.category?.category_name || 'Khác';

      summary.inventory_value += value;

      let status = 'Còn hàng';
      if (stock === 0) {
        status = 'Hết hàng';
        summary.out_of_stock += 1;
      } else if (stock <= reorderLevel) {
        status = 'Sắp hết';
        summary.needs_import += 1;
      }

      categoryMap[catName] = (categoryMap[catName] || 0) + stock;

      tableData.push({
        sku: p.sku,
        product_name: p.product_name,
        category: catName,
        stock_quantity: stock,
        reorder_level: reorderLevel,
        import_price: importPrice,
        inventory_value: value,
        status
      });
    });

    const chartData = Object.keys(categoryMap).map(category => ({
      category,
      stock: categoryMap[category]
    })).sort((a, b) => b.stock - a.stock);

    return {
      summary,
      chartData,
      tableData
    };
  }

  async getTopSellingReport(filters) {
    const { startDate, endDate, categoryId, supplierId, limit = 10 } = filters;
    const orders = await ReportRepository.getOrders(startDate, endDate);
    const orderIds = orders.map(o => o.order_id);
    let orderItems = await ReportRepository.getOrderItems(orderIds);
    let products = await ReportRepository.getProducts();

    orderItems = orderItems.filter(item => !item.product || item.product.deleted_at === null);
    
    if (categoryId) orderItems = orderItems.filter(item => item.product?.category_id === categoryId);
    if (supplierId) orderItems = orderItems.filter(item => item.product?.supplier_id === supplierId);

    const productStats = {};
    let total_sold = 0;

    orderItems.forEach(item => {
      const qty = Number(item.quantity) || 0;
      const subtotal = Number(item.subtotal) || 0;
      
      if (!productStats[item.product_id]) {
        productStats[item.product_id] = { qty: 0, revenue: 0 };
      }
      productStats[item.product_id].qty += qty;
      productStats[item.product_id].revenue += subtotal;
      total_sold += qty;
    });

    let topProducts = Object.keys(productStats).map(productId => {
      const p = products.find(prod => prod.product_id === productId);
      const stat = productStats[productId];
      return {
        product_id: productId,
        product_name: p?.product_name || 'Sản phẩm không rõ',
        sku: p?.sku || '',
        category: p?.category?.category_name || 'Khác',
        sold_quantity: stat.qty,
        revenue: stat.revenue,
        percentage: total_sold > 0 ? (stat.qty / total_sold) * 100 : 0
      };
    }).filter(p => p.sold_quantity > 0)
      .sort((a, b) => b.sold_quantity - a.sold_quantity);

    // Apply ranking and limit
    topProducts = topProducts.slice(0, limit).map((p, index) => ({
      ...p,
      rank: index + 1
    }));

    const summary = {
      top_product: topProducts.length > 0 ? topProducts[0].product_name : 'Không có',
      total_sold: topProducts.reduce((sum, p) => sum + p.sold_quantity, 0),
      top_revenue: topProducts.reduce((sum, p) => sum + p.revenue, 0)
    };

    return {
      summary,
      tableData: topProducts
    };
  }

  async getImportsReport(filters) {
    const { startDate, endDate, categoryId, supplierId } = filters;
    let movements = await ReportRepository.getStockMovements(startDate, endDate);

    movements = movements.filter(m => m.type === 'IMPORT' && (!m.product || m.product.deleted_at === null));

    if (categoryId) movements = movements.filter(m => m.product?.category_id === categoryId);
    if (supplierId) movements = movements.filter(m => m.product?.supplier_id === supplierId);

    const summary = {
      total_vouchers: movements.length,
      total_quantity: 0,
      total_value: 0,
      top_supplier: 'Không có'
    };

    const supplierMap = {};
    const dateMap = {};
    const tableData = [];

    movements.forEach(m => {
      const qty = Number(m.quantity) || 0;
      const price = Number(m.unit_price) || 0;
      const total = qty * price;
      const supplierName = m.product?.supplier?.supplier_name || 'Không rõ';
      const date = m.movement_date ? m.movement_date.split('T')[0] : (m.created_at ? m.created_at.split('T')[0] : 'N/A');

      summary.total_quantity += qty;
      summary.total_value += total;

      supplierMap[supplierName] = (supplierMap[supplierName] || 0) + total;
      dateMap[date] = (dateMap[date] || 0) + qty;

      tableData.push({
        date: m.created_at || m.movement_date,
        product_name: m.product?.product_name || 'Sản phẩm không rõ',
        supplier: supplierName,
        quantity: qty,
        unit_price: price,
        total,
        note: m.note || ''
      });
    });

    if (Object.keys(supplierMap).length > 0) {
      summary.top_supplier = Object.keys(supplierMap).reduce((a, b) => supplierMap[a] > supplierMap[b] ? a : b);
    }

    const chartData = Object.keys(dateMap).sort().map(date => ({
      date,
      quantity: dateMap[date]
    }));

    // Sort table data by date descending
    tableData.sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      summary,
      chartData,
      tableData
    };
  }
}

module.exports = new ReportService();
