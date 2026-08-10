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

      // 4. Ước tính số ngày tồn kho
      const daysOfStock = avgDailySales > 0 ? Math.ceil(currentStock / avgDailySales) : 999;

      // 5. Đánh giá ưu tiên (Priority)
      let priority = 'LOW';
      let reason = 'Tồn kho hiện tại vẫn đảm bảo.';
      
      if (currentStock <= 0) {
        priority = 'CRITICAL';
        reason = 'Sản phẩm đã hết hàng. Cần nhập gấp để đáp ứng nhu cầu.';
      } else if (currentStock <= reorderLvl && forecastQty > currentStock) {
        priority = 'HIGH';
        reason = `Tồn kho dưới mức tối thiểu (${reorderLvl}) và nguy cơ thiếu hàng cao trong ${forecastDays} ngày tới.`;
      } else if (currentStock <= reorderLvl) {
        priority = 'MEDIUM';
        reason = `Tồn kho dưới mức an toàn (${reorderLvl}).`;
      } else if (daysOfStock <= forecastDays) {
        priority = 'MEDIUM';
        reason = `Số lượng tồn kho ước tính chỉ đủ bán trong ${daysOfStock} ngày tới.`;
      }

      return {
        product_id: p.product_id,
        sku: p.sku,
        product_name: p.product_name,
        category_name: p.category_name,
        supplier_name: p.supplier_name,
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
      overview_comment: `Dựa trên dữ liệu ${historyDays} ngày qua, tổng nhu cầu dự kiến trong ${forecastDays} ngày tới là ${total_forecast_quantity} sản phẩm. Cần bổ sung ${total_suggested_import_quantity} đơn vị để đảm bảo không bị gián đoạn kinh doanh.`,
      inventory_comment: `Hiện tại có ${low_stock_count} sản phẩm nằm dưới mức tồn kho an toàn và ${slow_moving_count} sản phẩm có dấu hiệu tồn đọng kéo dài.`,
      sales_comment: `Có ${top_selling_products.length} mặt hàng đang là chủ lực doanh thu. Cần ưu tiên nguồn vốn để nhập các mặt hàng này.`,
      urgent_import_products,
      top_selling_products,
      slow_moving_products,
      category_insights: [],
      supplier_insights: [],
      recommended_actions
    };
  }
}

module.exports = new ForecastService();
