const supabase = require('../config/supabase');

class ProductRepository {
  async findAndCountAll(filters, page = 1, limit = 10) {
    let query = supabase
      .from('products')
      .select('*, category:categories(category_id, category_name), unit:units(unit_id, unit_name), supplier:suppliers(supplier_id, supplier_name)', { count: 'exact' })
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
      .select('*, category:categories(category_id, category_name), unit:units(unit_id, unit_name), supplier:suppliers(supplier_id, supplier_name)')
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
}

module.exports = new ProductRepository();
