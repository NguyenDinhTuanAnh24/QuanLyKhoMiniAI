const supabase = require('../config/supabase');

class ProductRepository {
  async findAndCountAll(filters, page = 1, limit = 10) {
    let query = supabase
      .from('products')
      .select('product_id, sku, product_name, product_name_en, image_url, category_id, unit_id, supplier_id, import_price, selling_price, stock_quantity, reorder_level, reorder_quantity, status, category:categories(category_id, category_name), unit:units(unit_id, unit_name), supplier:suppliers(supplier_id, supplier_name)', { count: 'exact' })
      .is('deleted_at', null);

    if (filters.search) {
      query = query.or(`product_name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
    }
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }
    if (filters.supplier_id) {
      query = query.eq('supplier_id', filters.supplier_id);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.stock_status) {
      if (filters.stock_status === 'out') {
        query = query.eq('stock_quantity', 0);
      } else if (filters.stock_status === 'in') {
        query = query.gt('stock_quantity', 0); // Temporary simple > 0 logic since Supabase JS doesn't support comparing columns easily
      } else if (filters.stock_status === 'low') {
        query = query.gt('stock_quantity', 0); // Will require RPC to compare stock <= reorder, but for now we skip complex part or handle simply
      }
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // Order by product_id or another relevant field since created_at is removed
    query = query.range(from, to).order('product_id', { ascending: false });

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { data, count };
  }

  async findById(id) {
    const { data, error } = await supabase
      .from('products')
      .select('product_id, sku, product_name, product_name_en, image_url, category_id, unit_id, supplier_id, import_price, selling_price, stock_quantity, reorder_level, reorder_quantity, status, date_received, expiration_date, warehouse_location, category:categories(category_id, category_name), unit:units(unit_id, unit_name), supplier:suppliers(supplier_id, supplier_name)')
      .eq('product_id', id)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data;
  }

  async findBySku(sku) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('sku', sku)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data;
  }

  async create(productData) {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async update(id, productData) {
    const { data, error } = await supabase
      .from('products')
      .update({ ...productData }) // No updated_at field in new schema
      .eq('product_id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async softDelete(id) {
    const { data, error } = await supabase
      .from('products')
      .update({ deleted_at: new Date().toISOString() })
      .eq('product_id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getStats() {
    const { data, error } = await supabase
      .from('products')
      .select('stock_quantity, reorder_level, import_price')
      .is('deleted_at', null);
      
    if (error) throw new Error(error.message);
    
    let totalProducts = data.length;
    let activeProducts = 0;
    let lowStockProducts = 0;
    let totalInventoryValue = 0;
    
    data.forEach(p => {
      const stock = p.stock_quantity || 0;
      const reorder = p.reorder_level || 0;
      if (stock > reorder) activeProducts++;
      if (stock <= reorder) lowStockProducts++;
      totalInventoryValue += (stock * (p.import_price || 0));
    });
    
    return {
      totalProducts,
      activeProducts,
      lowStockProducts,
      totalInventoryValue
    };
  }
}

module.exports = new ProductRepository();
