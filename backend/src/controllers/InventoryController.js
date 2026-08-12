const supabase = require('../config/supabase');
const notificationService = require('../services/NotificationService');

class InventoryController {
  /**
   * Create stock movement (IMPORT or EXPORT) with atomic transaction rollback,
   * stock boundary checks, old/new quantity validation, and session user tracking.
   */
  async createMovement(req, res, next) {
    try {
      const { items, type, note } = req.body;

      // 1. Validate Input Payload
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_PAYLOAD',
          message: 'Danh sách sản phẩm nhập/xuất kho không được để trống.'
        });
      }

      if (!['IMPORT', 'EXPORT'].includes(type)) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_TYPE',
          message: 'Loại thao tác kho phải là IMPORT (Nhập) hoặc EXPORT (Xuất).'
        });
      }

      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        if (!item.product_id) {
          return res.status(400).json({
            success: false,
            code: 'MISSING_PRODUCT_ID',
            message: `Sản phẩm ở vị trí ${idx + 1} thiếu mã sản phẩm (product_id).`
          });
        }
        if (!item.quantity || Number(item.quantity) <= 0) {
          return res.status(400).json({
            success: false,
            code: 'INVALID_QUANTITY',
            message: `Số lượng nhập/xuất cho sản phẩm ${item.product_id} phải lớn hơn 0.`
          });
        }
      }

      // 2. Pre-flight Validation: Fetch current products & check stock limits
      const productIds = items.map(i => i.product_id);
      const { data: fetchedProducts, error: fetchErr } = await supabase
        .from('products')
        .select('product_id, product_name, stock_quantity, reorder_level')
        .in('product_id', productIds);

      if (fetchErr) throw fetchErr;

      const productMap = {};
      (fetchedProducts || []).forEach(p => {
        productMap[p.product_id] = p;
      });

      // Verify all products exist and check stock limits for EXPORT
      const stockPlan = [];
      for (const item of items) {
        const p = productMap[item.product_id];
        if (!p) {
          return res.status(404).json({
            success: false,
            code: 'PRODUCT_NOT_FOUND',
            message: `Không tìm thấy sản phẩm có mã: ${item.product_id}`
          });
        }

        const qty = Number(item.quantity);
        const oldStock = Number(p.stock_quantity || 0);
        let newStock = oldStock;

        if (type === 'IMPORT') {
          newStock = oldStock + qty;
        } else { // EXPORT
          if (oldStock < qty) {
            return res.status(400).json({
              success: false,
              code: 'INSUFFICIENT_STOCK',
              message: `Không đủ tồn kho để xuất cho sản phẩm "${p.product_name || item.product_id}". Tồn kho hiện tại: ${oldStock}, yêu cầu xuất: ${qty}.`
            });
          }
          newStock = oldStock - qty;
        }

        if (newStock < 0) {
          return res.status(400).json({
            success: false,
            code: 'NEGATIVE_STOCK_FORBIDDEN',
            message: `Số lượng tồn kho không thể âm cho sản phẩm ${p.product_name || item.product_id}.`
          });
        }

        stockPlan.push({
          product_id: item.product_id,
          product_name: p.product_name || item.product_id,
          reorder_level: p.reorder_level || 10,
          old_quantity: oldStock,
          new_quantity: newStock,
          quantity: qty,
          unit_price: Number(item.unit_price || 0)
        });
      }

      // 3. Execution & Transaction Rollback setup
      const updatedHistory = []; // { product_id, old_quantity }
      const timestampStr = Date.now().toString();
      const randomSuffix = Math.floor(Math.random() * 9000 + 1000);
      const createdBy = req.user ? (req.user.full_name || req.user.user_id) : 'Hệ thống';

      try {
        // Step A: Update product stocks line by line with rollback tracking
        for (let i = 0; i < stockPlan.length; i++) {
          const plan = stockPlan[i];
          const { error: updErr } = await supabase
            .from('products')
            .update({ stock_quantity: plan.new_quantity })
            .eq('product_id', plan.product_id);

          if (updErr) {
            throw new Error(`Failed to update stock for ${plan.product_id}: ${updErr.message}`);
          }

          updatedHistory.push({
            product_id: plan.product_id,
            old_quantity: plan.old_quantity
          });
        }

        // Step B: Insert Stock Movements
        const movementsToInsert = stockPlan.map((plan, index) => ({
          movement_id: `MOV_${timestampStr}_${randomSuffix}_${index}`,
          product_id: plan.product_id,
          type: type,
          quantity: plan.quantity,
          old_quantity: plan.old_quantity,
          new_quantity: plan.new_quantity,
          unit_price: plan.unit_price,
          note: note || (type === 'IMPORT' ? 'Nhập kho trực tiếp' : 'Xuất kho trực tiếp'),
          created_at: new Date().toISOString()
        }));

        const { error: movErr } = await supabase
          .from('stock_movements')
          .insert(movementsToInsert);

        if (movErr) {
          throw new Error(`Failed to insert stock movements: ${movErr.message}`);
        }

        // Step C: Send Notifications & Low Stock Alerts
        for (const plan of stockPlan) {
          try {
            await notificationService.createNotification({
              title: type === 'IMPORT' ? `Nhập kho: ${plan.product_name}` : `Xuất kho: ${plan.product_name}`,
              message: `Đã ${type === 'IMPORT' ? 'nhập' : 'xuất'} số lượng ${plan.quantity} cho sản phẩm ${plan.product_name}. Tồn kho mới: ${plan.new_quantity}`,
              type: type === 'IMPORT' ? 'STOCK_IMPORT' : 'STOCK_EXPORT',
              related_link: '/inventory-ops',
              targetRoles: ['Quản trị viên', 'Chủ cửa hàng', 'Nhân viên kho']
            });

            if (plan.new_quantity <= plan.reorder_level) {
              await notificationService.checkAndCreateLowStockAlert(
                plan.product_id,
                plan.product_name,
                plan.new_quantity,
                plan.reorder_level
              );
            }
          } catch (notiErr) {
            console.error('Failed to dispatch stock notification:', notiErr);
          }
        }

        // Step D: Log Activity
        const ActivityLogService = require('../services/ActivityLogService');
        await ActivityLogService.logActivity({
          user_id: req.user ? req.user.user_id : null,
          user_name: createdBy,
          action: type === 'IMPORT' ? 'IMPORT_STOCK' : 'EXPORT_STOCK',
          entity_type: 'PRODUCT',
          entity_id: items.length > 1 ? 'MULTIPLE' : items[0].product_id,
          details: {
            role: req.user ? req.user.role : 'UNKNOWN',
            status: 'Thành công',
            item_count: items.length,
            note: note || ''
          }
        });

        return res.status(201).json({
          success: true,
          message: `Cập nhật tồn kho ${type === 'IMPORT' ? 'nhập' : 'xuất'} thành công.`,
          data: {
            type,
            movements: movementsToInsert
          }
        });

      } catch (execError) {
        console.error('Transaction failed during stock movement. Executing rollback...', execError);

        // ROLLBACK PRODUCT STOCKS TO ORIGINAL QUANTITIES
        for (const item of updatedHistory) {
          try {
            await supabase
              .from('products')
              .update({ stock_quantity: item.old_quantity })
              .eq('product_id', item.product_id);
          } catch (rbErr) {
            console.error(`Rollback error for product ${item.product_id}:`, rbErr);
          }
        }

        return res.status(500).json({
          success: false,
          code: 'STOCK_TRANSACTION_FAILED',
          message: `Giao dịch kho thất bại. Hệ thống đã khôi phục lại tồn kho ban đầu: ${execError.message}`
        });
      }

    } catch (error) {
      next(error);
    }
  }

  async getMovements(req, res, next) {
    try {
      const { type, search, limit = 50 } = req.query;
      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          products!inner(product_name, sku, unit_name)
        `)
        .order('created_at', { ascending: false })
        .limit(parseInt(limit));

      if (type) {
        query = query.eq('type', type);
      }
      
      const { data, error } = await query;
      if (error) throw error;

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getLowStockAlerts(req, res, next) {
    try {
      const { page = 1, limit = 5, search = '', category = '', status = '' } = req.query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);

      const { data: products, error } = await supabase
        .from('products')
        .select('product_id, sku, product_name, category_name, stock_quantity, reorder_level, reorder_quantity, suggested_import_quantity, unit_name, supplier_id')
        .is('deleted_at', null);

      if (error) throw error;

      let totalStock = 0;
      let outOfStockCount = 0;
      const lowStockItems = [];
      const uniqueCategories = new Set();

      if (products && products.length > 0) {
        for (const p of products) {
          totalStock += p.stock_quantity || 0;
          
          const safeLevel = p.reorder_level || 0;
          const stock = p.stock_quantity || 0;
          
          const isLowStock = stock <= safeLevel;
          
          if (isLowStock) {
            let alert_level = 'medium';
            let status = 'Sắp hết hàng';
            
            if (stock === 0) {
              status = 'Hết hàng';
              alert_level = 'critical';
              outOfStockCount++;
            } else if (stock > 0 && stock <= (0.2 * safeLevel)) {
              status = 'Rất nguy cấp';
              alert_level = 'high';
            }
            
            lowStockItems.push({
              product_id: p.product_id,
              sku: p.sku,
              product_name: p.product_name,
              category_name: p.category_name,
              stock_quantity: stock,
              reorder_level: safeLevel,
              status: status,
              alert_level: alert_level
            });
            
            if (p.category_name) {
              uniqueCategories.add(p.category_name);
            }
          }
        }
      }

      const summary = {
        total_products: products ? products.length : 0,
        low_stock_count: lowStockItems.length,
        out_of_stock_count: outOfStockCount,
        category_need_attention: uniqueCategories.size
      };

      // In-memory filtering
      let filteredItems = lowStockItems;

      if (search) {
        const lowerSearch = search.toLowerCase();
        filteredItems = filteredItems.filter(item => 
          (item.product_name && item.product_name.toLowerCase().includes(lowerSearch)) || 
          (item.sku && item.sku.toLowerCase().includes(lowerSearch))
        );
      }

      if (category) {
        filteredItems = filteredItems.filter(item => item.category_name === category);
      }

      if (status) {
        filteredItems = filteredItems.filter(item => {
          if (status === 'low') return item.alert_level === 'medium' || item.alert_level === 'high';
          if (status === 'out_of_stock') return item.status === 'Hết hàng';
          return item.status === status;
        });
      }

      const totalItems = filteredItems.length;
      const totalPages = Math.ceil(totalItems / limitNum) || 1;

      // Ensure pageNum is within bounds
      const validPageNum = Math.min(Math.max(1, pageNum), totalPages);

      // In-memory pagination
      const startIndex = (validPageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedItems = filteredItems.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          summary,
          alerts: paginatedItems,
          pagination: {
            currentPage: validPageNum,
            totalPages,
            totalItems
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Health & Integrity Check: Detect orphan records across products, orders, order_items, stock_movements
   */
  async checkDataIntegrity(req, res, next) {
    try {
      const orderRepository = require('../repositories/orderRepository');
      const integrityResult = await orderRepository.scanDataIntegrity();
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        data: integrityResult
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InventoryController();
