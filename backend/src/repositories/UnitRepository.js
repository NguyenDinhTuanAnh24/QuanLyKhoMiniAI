const supabase = require('../config/supabase');

class UnitRepository {
  async findAndCountAll(filters, page = 1, limit = 10) {
    let query = supabase
      .from('units')
      .select('*, products(count)', { count: 'exact' })
      .is('deleted_at', null);

    if (filters.search) {
      query = query.or(`unit_name.ilike.%${filters.search}%,unit_id.ilike.%${filters.search}%`);
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
      .from('units')
      .select('*')
      .eq('unit_id', id)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(dataObj) {
    const { data, error } = await supabase
      .from('units')
      .insert([dataObj])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id, dataObj) {
    dataObj.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('units')
      .update(dataObj)
      .eq('unit_id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async softDelete(id) {
    const { data, error } = await supabase
      .from('units')
      .update({ deleted_at: new Date().toISOString() })
      .eq('unit_id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = new UnitRepository();
