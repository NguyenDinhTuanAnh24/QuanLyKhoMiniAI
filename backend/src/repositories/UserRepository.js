const supabase = require('../config/supabase');

class UserRepository {
  async findAndCountAll(filters, page = 1, limit = 10) {
    let query = supabase
      .from('app_users')
      .select('*', { count: 'exact' })
      .is('deleted_at', null);

    if (filters.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
    }
    if (filters.role) {
      query = query.eq('role', filters.role);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { data, count };
  }

  async findById(id) {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('user_id', id)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data;
  }

  async findByEmail(email) {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', email)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data;
  }

  async create(userData) {
    const { data, error } = await supabase
      .from('app_users')
      .insert([userData])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async update(id, userData) {
    // Không có trường updated_at mặc định nên có thể bỏ qua nếu CSDL không cấu hình trigger
    userData.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('app_users')
      .update(userData)
      .eq('user_id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async softDelete(id) {
    const { data, error } = await supabase
      .from('app_users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}

module.exports = new UserRepository();
