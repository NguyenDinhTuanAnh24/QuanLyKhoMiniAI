class ForecastService {
  /**
   * Tính toán chỉ số dự báo cơ bản (rule-based)
   * @param {Array} rawProducts Dữ liệu đã map từ AIRepository (có sales_7d, 30d, 90d)
   * @param {number} forecastDays Số ngày cần dự báo (mặc định 14)
   * @returns {Array} Mảng các sản phẩm đã được tính toán forecast_14d và suggested_import_quantity
   */
  calculateBaseline(rawProducts, forecastDays = 14, historyDays = 90) {
    return rawProducts.map(p => {
      // 1. Tính trung bình bán hàng / ngày
      const total_sales = p.sales_90d || 0;
      const avgDailySales = historyDays > 0 ? parseFloat((total_sales / historyDays).toFixed(2)) : 0;

      // 2. Dự báo nhu cầu bán hàng trong N ngày tới
      let forecastQty = Math.ceil(avgDailySales * forecastDays);

      // 3. Tính số lượng cần nhập
      const currentStock = p.stock_quantity || 0;
      const reorderLvl = p.reorder_level || 0;
      
      const requiredStock = forecastQty + reorderLvl;
      const suggestedImportQty = Math.max(0, requiredStock - currentStock);
      const overstockQty = Math.max(0, currentStock - requiredStock);

      // 4. Ước tính số ngày tồn kho
      const daysOfStock = avgDailySales > 0 ? Math.ceil(currentStock / avgDailySales) : 999;

      // 5. Đánh giá ưu tiên (Priority)
      let priority = 'LOW';
      let reason = 'Tồn kho hiện tại vẫn đảm bảo.';
      
      if (currentStock <= 0) {
        priority = 'CRITICAL';
        reason = 'Sản phẩm đã hết hàng. Cần nhập gấp để đáp ứng nhu cầu.';
      } else if (daysOfStock <= 3) {
        priority = 'CRITICAL';
        reason = `Tồn kho chỉ đủ bán trong ${daysOfStock} ngày tới. Rủi ro hết hàng rất cao.`;
      } else if (daysOfStock <= 7 || currentStock <= reorderLvl) {
        priority = 'HIGH';
        reason = `Tồn kho dưới mức an toàn hoặc dự kiến hết trong 7 ngày tới.`;
      } else if (forecastQty > currentStock) {
        priority = 'MEDIUM';
        reason = `Tồn kho hiện tại thấp hơn tổng nhu cầu dự báo.`;
      } else if (overstockQty > 0 && daysOfStock > 60) {
        priority = 'LOW';
        reason = `Sản phẩm có dấu hiệu dư thừa, đủ bán trong ${daysOfStock} ngày.`;
      }

      return {
        product_id: p.product_id,
        sku: p.sku,
        product_name: p.product_name,
        supplier_id: p.supplier_id || null,
        category_name: p.category_name,
        supplier_name: p.supplier_name || 'Chưa xác định nhà cung cấp',
        unit_name: p.unit_name,
        stock_quantity: currentStock,
        reorder_level: reorderLvl,
        sales_history_days: historyDays,
        sales_history_quantity: total_sales,
        sales_90d: total_sales,
        avg_daily_sales: avgDailySales,
        avg_daily_sales_90d: avgDailySales,
        forecast_days: forecastDays,
        forecast_quantity: forecastQty,
        forecast_14d: forecastQty,
        days_of_stock: daysOfStock,
        suggested_import_quantity: suggestedImportQty,
        overstock_quantity: overstockQty,
        priority,
        reason,
        status: p.status || 'PENDING'
      };
    });
  }

  /**
   * Tạo báo cáo chi tiết rule-based khi không dùng AI hoặc dự phòng cho AI
   */
  buildDetailedReport(forecastItems, forecastDays = 14, historyDays = 90) {
    const total_products = forecastItems.length;
    const need_import_count = forecastItems.filter(p => p.suggested_import_quantity > 0).length;
    const low_stock_count = forecastItems.filter(p => p.stock_quantity <= p.reorder_level).length;
    const slow_moving_count = forecastItems.filter(p => p.avg_daily_sales < 0.1 && p.stock_quantity > 0).length;
    const out_of_stock_count = forecastItems.filter(p => p.stock_quantity <= 0).length;
    
    const total_forecast_quantity = forecastItems.reduce((acc, p) => acc + (p.forecast_quantity || 0), 0);
    const total_suggested_import_quantity = forecastItems.reduce((acc, p) => acc + (p.suggested_import_quantity || 0), 0);

    const urgent_import_products = [...forecastItems]
      .filter(p => p.priority === 'CRITICAL' || p.priority === 'HIGH' || p.suggested_import_quantity > 0)
      .sort((a, b) => b.suggested_import_quantity - a.suggested_import_quantity)
      .slice(0, 10);

    const top_selling_products = [...forecastItems]
      .filter(p => p.avg_daily_sales > 0)
      .sort((a, b) => b.avg_daily_sales - a.avg_daily_sales)
      .slice(0, 5)
      .map(p => ({
        ...p,
        reason: `Bán được trung bình ${p.avg_daily_sales} sản phẩm mỗi ngày trong ${historyDays} ngày qua.`
      }));

    const slow_moving_products = [...forecastItems]
      .filter(p => p.avg_daily_sales < 0.2 && p.stock_quantity > 0)
      .sort((a, b) => b.stock_quantity - a.stock_quantity)
      .slice(0, 5)
      .map(p => ({
        ...p,
        reason: p.avg_daily_sales === 0 ? 'Không bán được sản phẩm nào trong kỳ.' : `Tốc độ bán rất chậm, ước tính còn ${p.days_of_stock} ngày mới hết hàng.`
      }));

    const recommended_actions = [];
    if (need_import_count > 0) {
      recommended_actions.push({
        label: 'Tạo phiếu nhập cho sản phẩm ưu tiên',
        description: `Hệ thống ghi nhận ${need_import_count} sản phẩm cần nhập gấp để tránh đứt gãy cung ứng.`
      });
    }
    if (slow_moving_count > 0) {
      recommended_actions.push({
        label: 'Khuyến mãi xả hàng bán chậm',
        description: `Có ${slow_moving_count} sản phẩm đang tồn kho nhưng bán rất chậm, nên cân nhắc giảm giá.`
      });
    }
    if (recommended_actions.length === 0) {
      recommended_actions.push({
        label: 'Tiếp tục theo dõi tồn kho',
        description: 'Mọi chỉ số tồn kho đang ở mức an toàn. Hãy duy trì tốc độ nhập xuất như hiện tại.'
      });
    }

    // Aggregate Supplier Insights
    const supplierMap = new Map();
    forecastItems.forEach(p => {
      const sId = p.supplier_id || 'UNKNOWN';
      if (!supplierMap.has(sId)) {
        supplierMap.set(sId, {
          supplier_id: p.supplier_id || null,
          supplier_name: p.supplier_name,
          product_count: 0,
          need_import_count: 0,
          total_suggested_import_quantity: 0,
          low_stock_count: 0,
          out_of_stock_count: 0,
          total_stock_quantity: 0
        });
      }
      const sData = supplierMap.get(sId);
      sData.product_count += 1;
      sData.total_stock_quantity += p.stock_quantity;
      if (p.suggested_import_quantity > 0) sData.need_import_count += 1;
      sData.total_suggested_import_quantity += p.suggested_import_quantity;
      if (p.stock_quantity <= p.reorder_level) sData.low_stock_count += 1;
      if (p.stock_quantity <= 0) sData.out_of_stock_count += 1;
    });
    
    const supplier_insights = Array.from(supplierMap.values());

    let status = 'STABLE';
    if (need_import_count > 0 || out_of_stock_count > 0) status = 'CRITICAL';
    else if (low_stock_count > 0 || slow_moving_count > 5) status = 'WARNING';

    const overview = `Dựa trên dữ liệu ${historyDays} ngày qua, tổng nhu cầu dự báo là ${total_forecast_quantity} đơn vị. Hệ thống đề xuất nhập thêm ${total_suggested_import_quantity} đơn vị để đảm bảo không bị gián đoạn kinh doanh. Tình hình tồn kho hiện tại đang ở mức ${status === 'STABLE' ? 'ổn định' : status === 'WARNING' ? 'cần chú ý' : 'khẩn cấp'}.`;

    const key_findings = [];
    if (need_import_count > 0) key_findings.push(`Có ${need_import_count} mặt hàng đang thuộc nhóm cần nhập ưu tiên.`);
    if (top_selling_products.length > 0) key_findings.push(`Ghi nhận ${top_selling_products.length} mặt hàng có tốc độ bán nổi bật trong kỳ phân tích.`);
    if (slow_moving_products.length > 0) key_findings.push(`Phát hiện ${slow_moving_products.length} mặt hàng thuộc nhóm bán chậm và cần xem xét giảm nhập.`);
    if (low_stock_count > 0) key_findings.push(`Có ${low_stock_count} sản phẩm có mức tồn thấp hơn ngưỡng an toàn.`);

    const risks = [];
    if (low_stock_count > 0) risks.push(`Nguy cơ thiếu hàng ở những mặt hàng tồn dưới mức an toàn (${low_stock_count} mặt hàng).`);
    if (slow_moving_count > 0) risks.push(`Có ${slow_moving_count} mặt hàng có tốc độ quay vòng thấp, làm tăng chi phí lưu kho.`);
    if (out_of_stock_count > 0) risks.push(`Có ${out_of_stock_count} mặt hàng đã hết hoàn toàn trong kho, gây mất doanh thu trực tiếp.`);

    const opportunities = [];
    if (top_selling_products.length > 0) opportunities.push(`Ưu tiên ngân sách cho nhóm ${top_selling_products.length} mặt hàng có nhu cầu và tốc độ bán tốt.`);
    if (slow_moving_count > 0) opportunities.push(`Giảm nhập hoặc tổ chức khuyến mại cho nhóm bán chậm để thu hồi vốn.`);

    return {
      summary: {
        total_products,
        need_import_count,
        low_stock_count,
        slow_moving_count,
        forecast_days: forecastDays,
        history_days: historyDays,
        total_forecast_quantity,
        total_suggested_import_quantity
      },
      executive_summary: {
        status,
        overview,
        key_findings,
        risks,
        opportunities,
        recommended_actions
      },
      urgent_import_products,
      top_selling_products,
      slow_moving_products,
      category_insights: [],
      supplier_insights
    };
  }
}

module.exports = new ForecastService();
