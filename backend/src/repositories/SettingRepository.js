const supabase = require('../config/supabase');

class SettingRepository {
  async getSettings() {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 'DEFAULT')
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data;
  }

  async updateSettings(settingsData) {
    settingsData.updated_at = new Date().toISOString();
    
    // Xóa id nếu có trong body để tránh lỗi update PK
    if (settingsData.id) {
      delete settingsData.id;
    }

    const { data, error } = await supabase
      .from('settings')
      .update(settingsData)
      .eq('id', 'DEFAULT')
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}

module.exports = new SettingRepository();
