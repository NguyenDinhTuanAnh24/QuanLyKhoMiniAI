const supabase = require('../config/supabase');

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
        
        // get current stock
        const { data: p, error: pErr } = await supabase
          .from('products')
          .select('stock_quantity')
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
      }

      // insert movements
      if (movementsToInsert.length > 0) {
        const { error: movErr } = await supabase
          .from('stock_movements')
          .insert(movementsToInsert);
        if (movErr) throw movErr;
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
        .select('product_id, sku, product_name, category_name, stock_quantity, reorder_level');

      if (error) throw error;

      let totalStock = 0;
      const lowStockItems = [];
      const uniqueCategories = new Set();

      if (products && products.length > 0) {
        for (const p of products) {
          totalStock += p.stock_quantity || 0;
          
          const safeLevel = p.reorder_level || 0;
          const stock = p.stock_quantity || 0;
          
          const isLowStock = stock <= safeLevel;
          
          if (isLowStock) {
            let alert_status = 'Sắp hết hàng';
            
            if (stock === 0) {
              alert_status = 'Hết hàng';
            } else if (stock > 0 && stock <= (0.2 * safeLevel)) {
              alert_status = 'Rất nguy cấp';
            }
            
            lowStockItems.push({
              product_id: p.product_id,
              sku: p.sku,
              product_name: p.product_name,
              category_name: p.category_name,
              stock_quantity: stock,
              reorder_level: safeLevel,
              alert_status
            });
            
            if (p.category_name) {
              uniqueCategories.add(p.category_name);
            }
          }
        }
      }

      // KPIs uses global lowStockItems
      const kpis = {
        totalProductsInStock: totalStock,
        lowStockProductsCount: lowStockItems.length,
        categoriesNeedingAttention: uniqueCategories.size
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
        filteredItems = filteredItems.filter(item => item.alert_status === status);
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
          kpis,
          items: paginatedItems,
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
