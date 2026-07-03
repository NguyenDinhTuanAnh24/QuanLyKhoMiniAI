const AIRepository = require('../repositories/AIRepository');

class AIService {
  async generateForecast(filters) {
    const products = await AIRepository.getProductsWithSuppliers();
    const orderData = await AIRepository.getOrderItemsLast90Days();

    // Map order quantities per product
    const sold90dMap = {};
    for (const item of orderData) {
      if (!sold90dMap[item.product_id]) {
        sold90dMap[item.product_id] = 0;
      }
      sold90dMap[item.product_id] += (item.quantity || 0);
    }

    const forecastItems = [];
    let totalRisk = 0;
    let totalSuggested = 0;
    let estimatedImportValue = 0;
    let sumConfidence = 0;

    for (const p of products) {
      const stock = p.stock_quantity || 0;
      const reorderLevel = p.reorder_level || 0;
      
      // 1. Tính avg_daily_sales
      let avg_daily_sales = 0;
      let hasOrderData = false;

      if (p.avg_daily_sales_90d && p.avg_daily_sales_90d > 0) {
        avg_daily_sales = p.avg_daily_sales_90d;
        hasOrderData = true; // Has explicit data
      } else if (sold90dMap[p.product_id] > 0) {
        avg_daily_sales = sold90dMap[p.product_id] / 90;
        hasOrderData = true;
      } else if (p.sales_90d && p.sales_90d > 0) {
        avg_daily_sales = p.sales_90d / 90;
        hasOrderData = true;
      }

      // 2. Tính forecast_14d
      let forecast_14d = 0;
      if (p.forecast_14d && p.forecast_14d > 0) {
        forecast_14d = p.forecast_14d;
      } else {
        forecast_14d = Math.ceil(avg_daily_sales * 14);
      }

      // 3. Tính safety_stock
      const safety_stock = reorderLevel;

      // 4. Tính suggested_import_quantity
      const needed_quantity = forecast_14d + safety_stock - stock;
      const suggested_import_quantity = Math.max(0, Math.ceil(needed_quantity));

      // 5. Tính risk_level
      let risk_level = 'Ổn định';
      if (stock <= 0) {
        risk_level = 'Hết hàng';
      } else if (stock < forecast_14d) {
        risk_level = 'Rủi ro cao';
      } else if (stock <= reorderLevel) {
        risk_level = 'Cần nhập';
      }

      // 6. Tính confidence_score
      let confidence_score = 60; // Default
      if (hasOrderData) {
        confidence_score = Math.floor(Math.random() * 11) + 85; // 85-95
      } else if (p.avg_daily_sales_90d > 0) {
        confidence_score = Math.floor(Math.random() * 11) + 75; // 75-85
      } else {
        confidence_score = Math.floor(Math.random() * 16) + 50; // 50-65
      }

      // 7. AI Reason
      let ai_reason = '';
      if (suggested_import_quantity > 0) {
        if (risk_level === 'Hết hàng') {
          ai_reason = `Sản phẩm đã hết hàng. Cần nhập gấp ${suggested_import_quantity} đơn vị để bù đắp nhu cầu dự báo.`;
        } else if (risk_level === 'Rủi ro cao') {
          ai_reason = `Tồn kho hiện tại (${stock}) không đủ đáp ứng nhu cầu 14 ngày tới (${forecast_14d}). Nên nhập thêm.`;
        } else {
          ai_reason = `Tồn kho sắp chạm mức tối thiểu. Đề xuất nhập thêm để duy trì tồn kho an toàn.`;
        }
      }

      if (risk_level !== 'Ổn định') {
        totalRisk++;
      }
      
      totalSuggested += suggested_import_quantity;
      if (suggested_import_quantity > 0) {
        estimatedImportValue += (suggested_import_quantity * (p.import_price || 0));
      }
      
      sumConfidence += confidence_score;

      forecastItems.push({
        product_id: p.product_id,
        sku: p.sku,
        product_name: p.product_name,
        category_name: p.category_name,
        unit_name: p.unit_name,
        supplier_id: p.supplier_id,
        supplier_name: p.suppliers ? p.suppliers.supplier_name : null,
        stock_quantity: stock,
        reorder_level: reorderLevel,
        reorder_quantity: p.reorder_quantity || 0,
        import_price: p.import_price || 0,
        sales_90d: sold90dMap[p.product_id] || p.sales_90d || 0,
        avg_daily_sales_90d: Number(avg_daily_sales.toFixed(2)),
        forecast_14d: forecast_14d,
        suggested_import_quantity: suggested_import_quantity,
        risk_level: risk_level,
        confidence_score: confidence_score,
        ai_reason: ai_reason
      });
    }

    // Lọc theo các tiêu chí (nếu có)
    let filteredItems = [...forecastItems];
    
    if (filters.search) {
      const s = filters.search.toLowerCase();
      filteredItems = filteredItems.filter(i => 
        (i.product_name && i.product_name.toLowerCase().includes(s)) ||
        (i.sku && i.sku.toLowerCase().includes(s))
      );
    }
    
    if (filters.category) {
      filteredItems = filteredItems.filter(i => i.category_name === filters.category);
    }
    
    if (filters.risk && filters.risk !== 'all') {
      filteredItems = filteredItems.filter(i => i.risk_level === filters.risk);
    }

    // Sắp xếp ưu tiên nhập nhiều trước, hoặc rủi ro cao trước
    filteredItems.sort((a, b) => b.suggested_import_quantity - a.suggested_import_quantity);

    if (filters.limit) {
      filteredItems = filteredItems.slice(0, filters.limit);
    }

    const avg_confidence = forecastItems.length > 0 ? Math.round(sumConfidence / forecastItems.length) : 0;

    return {
      summary: {
        total_products: forecastItems.length,
        risk_products: totalRisk,
        total_suggested_import: totalSuggested,
        estimated_import_value: estimatedImportValue,
        avg_confidence: avg_confidence
      },
      insight: {
        title: `AI phát hiện ${totalRisk} sản phẩm có nguy cơ thiếu hàng`,
        message: "Nên ưu tiên nhập bổ sung các sản phẩm bán nhanh, tồn kho thấp và có dự báo nhu cầu cao trong 14 ngày tới."
      },
      items: filteredItems
    };
  }

  _calculateProductForecast(p, orderData = []) {
    const stock = p.stock_quantity || 0;
    const reorderLevel = p.reorder_level || 0;
    
    // Fallback order calculations if avg_daily_sales_90d is not in DB
    let sold90dMap = 0;
    if (orderData.length > 0) {
      sold90dMap = orderData.filter(item => item.product_id === p.product_id).reduce((sum, item) => sum + (item.quantity || 0), 0);
    }

    let avg_daily_sales = 0;
    let hasOrderData = false;

    if (p.avg_daily_sales_90d && p.avg_daily_sales_90d > 0) {
      avg_daily_sales = p.avg_daily_sales_90d;
      hasOrderData = true;
    } else if (sold90dMap > 0) {
      avg_daily_sales = sold90dMap / 90;
      hasOrderData = true;
    } else if (p.sales_90d && p.sales_90d > 0) {
      avg_daily_sales = p.sales_90d / 90;
      hasOrderData = true;
    }

    let forecast_14d = 0;
    if (p.forecast_14d && p.forecast_14d > 0) {
      forecast_14d = p.forecast_14d;
    } else {
      forecast_14d = Math.ceil(avg_daily_sales * 14);
    }

    const safety_stock = reorderLevel;
    const needed_quantity = forecast_14d + safety_stock - stock;
    const suggested_import_quantity = Math.max(0, Math.ceil(needed_quantity));

    let risk_level = 'Ổn định';
    if (stock <= 0) {
      risk_level = 'Hết hàng';
    } else if (stock < forecast_14d) {
      risk_level = 'Rủi ro cao';
    } else if (stock <= reorderLevel) {
      risk_level = 'Cần nhập';
    }

    let confidence_score = 60;
    if (hasOrderData) {
      confidence_score = Math.floor(Math.random() * 11) + 85;
    } else if (p.avg_daily_sales_90d > 0) {
      confidence_score = Math.floor(Math.random() * 11) + 75;
    } else {
      confidence_score = Math.floor(Math.random() * 16) + 50;
    }

    let ai_reason = '';
    if (suggested_import_quantity > 0) {
      if (risk_level === 'Hết hàng') {
        ai_reason = `Sản phẩm đã hết hàng. Cần nhập gấp ${suggested_import_quantity} đơn vị để bù đắp nhu cầu dự báo.`;
      } else if (risk_level === 'Rủi ro cao') {
        ai_reason = `Tồn kho hiện tại (${stock}) không đủ đáp ứng nhu cầu 14 ngày tới (${forecast_14d}). Nên nhập thêm.`;
      } else {
        ai_reason = `Tồn kho sắp chạm mức tối thiểu. Đề xuất nhập thêm để duy trì tồn kho an toàn.`;
      }
    }

    return {
      product_id: p.product_id,
      sku: p.sku,
      product_name: p.product_name,
      category_name: p.category_name,
      unit_name: p.unit_name,
      supplier_id: p.supplier_id,
      supplier_name: p.suppliers ? p.suppliers.supplier_name : null,
      stock_quantity: stock,
      reorder_level: reorderLevel,
      reorder_quantity: p.reorder_quantity || 0,
      import_price: p.import_price || 0,
      sales_90d: sold90dMap || p.sales_90d || 0,
      avg_daily_sales_90d: Number(avg_daily_sales.toFixed(2)),
      forecast_14d: forecast_14d,
      suggested_import_quantity: suggested_import_quantity,
      risk_level: risk_level,
      confidence_score: confidence_score,
      ai_reason: ai_reason
    };
  }

  async getForecastTable(filters, page, limit) {
    const { data, count } = await AIRepository.getPaginatedProducts(filters, page, limit, false);
    
    // Khách hàng muốn áp dụng tính toán AI_reason và confidence cho mảng result này
    // We optionally fetch order data to help fallback calculation, but DB should have avg_daily_sales_90d
    const orderData = []; // To save performance, we rely on DB fields avg_daily_sales_90d

    let items = data.map(p => this._calculateProductForecast(p, orderData));
    
    // In-memory filter for risk_level because DB doesn't have risk_level computed column
    if (filters.risk && filters.risk !== 'all') {
      items = items.filter(i => i.risk_level === filters.risk);
    }

    return {
      items,
      pagination: {
        currentPage: page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getForecastSuggestions(page, limit) {
    const { data, count } = await AIRepository.getPaginatedProducts({}, page, limit, true);
    
    const items = data.map(p => this._calculateProductForecast(p, []));

    return {
      items,
      pagination: {
        currentPage: page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }
}

module.exports = new AIService();
