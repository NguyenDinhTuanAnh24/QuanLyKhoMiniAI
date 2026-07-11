class ForecastService {
  /**
   * Tính toán chỉ số dự báo cơ bản (rule-based)
   * @param {Array} rawProducts Dữ liệu đã map từ AIRepository (có sales_7d, 30d, 90d)
   * @param {number} forecastDays Số ngày cần dự báo (mặc định 14)
   * @returns {Array} Mảng các sản phẩm đã được tính toán forecast_14d và suggested_import_quantity
   */
  calculateBaseline(rawProducts, forecastDays = 14) {
    return rawProducts.map(p => {
      // 1. Tính trung bình bán hàng / ngày (trong 90 ngày)
      const avgDailySales90d = parseFloat((p.sales_90d / 90).toFixed(2));

      // 2. Dự báo nhu cầu bán hàng trong N ngày tới
      let forecastNd = 0;
      if (p.sales_90d === 0) {
        // Nếu không có lịch sử bán hàng, forecast = 0
        forecastNd = 0;
      } else {
        forecastNd = Math.ceil(avgDailySales90d * forecastDays);
      }

      // 3. Tính số lượng cần nhập
      const currentStock = p.stock_quantity || 0;
      const reorderLvl = p.reorder_level || 0;
      
      // Số lượng kho cần thiết = Tồn tối thiểu + Số bán dự kiến
      const requiredStock = forecastNd + reorderLvl;
      
      // Số cần nhập = max(0, Tồn cần thiết - Tồn hiện tại)
      let suggestedImportQty = Math.max(0, requiredStock - currentStock);

      // 4. Đánh giá ưu tiên (Priority)
      let priority = 'Thấp';
      let reason = 'Tồn kho hiện tại vẫn đảm bảo.';

      if (p.sales_90d === 0) {
        reason = 'Chưa có nhiều dữ liệu bán hàng. Gợi ý dựa trên mức tồn tối thiểu.';
        if (currentStock <= reorderLvl) {
          priority = 'Trung bình';
          suggestedImportQty = Math.max(0, reorderLvl - currentStock);
        }
      } else if (currentStock <= 0) {
        priority = 'Cao';
        reason = 'Sản phẩm đã hết hàng. Cần nhập gấp để đáp ứng nhu cầu.';
      } else if (currentStock <= reorderLvl && forecastNd > 0) {
        priority = 'Cao';
        reason = `Tồn kho dưới mức tối thiểu (${reorderLvl}) và dự kiến bán được ${forecastNd} sp trong ${forecastDays} ngày tới.`;
      } else if (currentStock <= reorderLvl) {
        priority = 'Trung bình';
        reason = `Tồn kho dưới mức an toàn (${reorderLvl}).`;
      } else if (forecastNd > currentStock) {
        priority = 'Trung bình';
        reason = `Nhu cầu dự kiến (${forecastNd}) cao hơn tồn kho hiện tại (${currentStock}).`;
      }

      return {
        product_id: p.product_id,
        product_name: p.product_name,
        sku: p.sku,
        category_name: p.category_name,
        supplier_name: p.supplier_name,
        unit_name: p.unit_name,
        stock_quantity: currentStock,
        reorder_level: reorderLvl,
        sales_90d: p.sales_90d,
        avg_daily_sales_90d: avgDailySales90d,
        forecast_14d: forecastNd, // Biến này giữ nguyên tên theo DB schema dù forecastDays có thể đổi
        suggested_import_quantity: suggestedImportQty,
        priority,
        reason
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
    const slow_moving_count = forecastItems.filter(p => p.avg_daily_sales_90d < 0.1 && p.stock_quantity > 0).length;
    
    const total_forecast_quantity = forecastItems.reduce((acc, p) => acc + (p.forecast_14d || 0), 0);
    const total_suggested_import_quantity = forecastItems.reduce((acc, p) => acc + (p.suggested_import_quantity || 0), 0);

    const urgent_import_products = [...forecastItems]
      .filter(p => p.priority === 'Cao' || p.suggested_import_quantity > 0)
      .sort((a, b) => b.suggested_import_quantity - a.suggested_import_quantity)
      .slice(0, 10);

    const top_selling_products = [...forecastItems]
      .filter(p => p.avg_daily_sales_90d > 0)
      .sort((a, b) => b.avg_daily_sales_90d - a.avg_daily_sales_90d)
      .slice(0, 5)
      .map(p => ({
        ...p,
        reason: `Bán được trung bình ${p.avg_daily_sales_90d} sản phẩm mỗi ngày trong ${historyDays} ngày qua.`
      }));

    const slow_moving_products = [...forecastItems]
      .filter(p => p.avg_daily_sales_90d < 0.2 && p.stock_quantity > 0)
      .sort((a, b) => b.stock_quantity - a.stock_quantity)
      .slice(0, 5)
      .map(p => ({
        ...p,
        stock_days_remaining: p.avg_daily_sales_90d > 0 ? Math.ceil(p.stock_quantity / p.avg_daily_sales_90d) : 999,
        reason: p.avg_daily_sales_90d === 0 ? 'Không bán được sản phẩm nào trong kỳ.' : `Tốc độ bán rất chậm, ước tính còn ${Math.ceil(p.stock_quantity / p.avg_daily_sales_90d)} ngày mới hết hàng.`
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
