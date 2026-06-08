const supabase = require('../config/supabase');

class CategoryRepository {
  async findAndCountAll(filters, page = 1, limit = 10) {
    let query = supabase
      .from('categories')
      .select('*, products(count)', { count: 'exact' })
      .is('deleted_at', null);

    if (filters.search) {
      query = query.or(`category_name.ilike.%${filters.search}%,category_id.ilike.%${filters.search}%`);
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
      .from('categories')
      .select('*')
      .eq('category_id', id)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(dataObj) {
    const { data, error } = await supabase
      .from('categories')
      .insert([dataObj])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id, dataObj) {
    dataObj.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('categories')
      .update(dataObj)
      .eq('category_id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async softDelete(id) {
    const { data, error } = await supabase
      .from('categories')
      .update({ deleted_at: new Date().toISOString() })
      .eq('category_id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = new CategoryRepository();
