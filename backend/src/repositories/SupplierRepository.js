const supabase = require('../config/supabase');

class SupplierRepository {
  async findAndCountAll(filters, page = 1, limit = 10) {
    let query = supabase
      .from('suppliers')
      .select('*, products(count)', { count: 'exact' })
      .is('deleted_at', null);

    if (filters.search) {
      query = query.or(`supplier_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;
    if (error) throw error;
    return { data, count };
  }

  async findById(id) {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('supplier_id', id)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(dataObj) {
    const { data, error } = await supabase
      .from('suppliers')
      .insert([dataObj])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id, dataObj) {
    dataObj.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('suppliers')
      .update(dataObj)
      .eq('supplier_id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async softDelete(id) {
    const { data, error } = await supabase
      .from('suppliers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('supplier_id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = new SupplierRepository();
