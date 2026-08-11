const supabase = require('../config/supabase');
const notificationService = require('../services/NotificationService');

class InventoryController {
  async createMovement(req, res, next) {
    try {
      const { items, type, note } = req.body;
      // items: [{ product_id, quantity, unit_price }]
      // type: 'IMPORT' | 'EXPORT'

      const timestampStr = Date.now().toString().slice(-6);
      
      const movementsToInsert = [];
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // get current stock, product name and reorder level
        const { data: p, error: pErr } = await supabase
          .from('products')
          .select('stock_quantity, product_name, reorder_level')
          .eq('product_id', item.product_id)
          .single();
          
        if (pErr) throw pErr;
        
        let newStock = p.stock_quantity;
        if (type === 'IMPORT') {
          newStock += item.quantity;
        } else {
          newStock -= item.quantity;
        }
        
        // update stock
        const { error: updErr } = await supabase
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('product_id', item.product_id);
          
        if (updErr) throw updErr;

        movementsToInsert.push({
          movement_id: `MOV${timestampStr}${Math.floor(Math.random() * 100)}${i}`,
          product_id: item.product_id,
          type: type,
          quantity: item.quantity,
          old_quantity: p.stock_quantity,
          new_quantity: newStock,
          unit_price: item.unit_price || 0,
          note: note || ''
        });

        try {
          await notificationService.createNotification({
            title: type === 'IMPORT' ? `Nhập kho: ${p.product_name || item.product_id}` : `Xuất kho: ${p.product_name || item.product_id}`,
            message: `Đã ${type === 'IMPORT' ? 'nhập' : 'xuất'} số lượng ${item.quantity} cho sản phẩm ${p.product_name || item.product_id}. Tồn kho mới: ${newStock}`,
            type: type === 'IMPORT' ? 'STOCK_IMPORTED' : 'STOCK_EXPORTED',
            severity: 'INFO',
            relatedType: 'PRODUCT',
            relatedId: item.product_id,
            recipientRoles: ['ADMIN', 'OWNER', 'WAREHOUSE_STAFF'],
            dedupKey: `STOCK_MOVEMENT:${type}:${item.product_id}:${timestampStr}${i}`
          });

          await notificationService.checkAndCreateStockAlert({
            productId: item.product_id,
            productName: p.product_name || item.product_id,
            oldStock: p.stock_quantity,
            newStock: newStock,
            reorderLevel: p.reorder_level || 10,
            movementId: `MOV${timestampStr}${Math.floor(Math.random() * 100)}${i}`
          });
        } catch (notiErr) {
          console.error('Failed to create notification inside InventoryController:', notiErr);
        }
      }

      // insert movements
      if (movementsToInsert.length > 0) {
        const { error: movErr } = await supabase
          .from('stock_movements')
          .insert(movementsToInsert);
        if (movErr) throw movErr;
        
        // Log activity
        const ActivityLogService = require('../services/ActivityLogService');
        await ActivityLogService.logActivity({
          user_id: req.user ? req.user.user_id : null,
          user_name: req.user ? req.user.full_name : 'Unknown',
          action: type === 'IMPORT' ? 'IMPORT_STOCK' : 'EXPORT_STOCK',
          entity_type: 'PRODUCT',
          entity_id: items.length > 1 ? 'MULTIPLE' : items[0].product_id,
          details: { role: req.user.role, status: 'Thành công', item_count: items.length, note }
        });
      }

      res.status(201).json({ success: true, message: 'Stock updated successfully' });
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
}

module.exports = new InventoryController();
