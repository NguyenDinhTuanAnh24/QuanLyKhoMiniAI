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
}

module.exports = new InventoryController();
