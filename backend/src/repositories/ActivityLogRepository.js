const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

class ActivityLogRepository {
  async logActivity(data) {
    const { user_id, user_name, action, entity_type, entity_id, details } = data;
    const { data: result, error } = await supabase
      .from('activity_logs')
      .insert([{
        id: uuidv4(),
        user_id,
        user_name,
        action,
        entity_type,
        entity_id,
        details
      }])
      .select()
      .single();

    if (error) throw new Error(`Lỗi khi lưu nhật ký hoạt động: ${error.message}`);
    return result;
  }

  async getLogs(options = {}) {
    let query = supabase
      .from('activity_logs')
      .select('*', { count: 'exact' });

    // Lọc theo action nếu có
    if (options.action) {
      query = query.eq('action', options.action);
    }
    
    // Lọc theo entity_type nếu có
    if (options.entity_type) {
      query = query.eq('entity_type', options.entity_type);
    }

    // Sắp xếp mặc định mới nhất lên đầu
    query = query.order('created_at', { ascending: false });

    // Phân trang
    const page = options.page ? parseInt(options.page) : 1;
    const limit = options.limit ? parseInt(options.limit) : 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw new Error(`Lỗi khi lấy nhật ký hoạt động: ${error.message}`);
    
    return {
      data,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }
}

module.exports = new ActivityLogRepository();
