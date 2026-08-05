const ActivityLogRepository = require('../repositories/ActivityLogRepository');

class ActivityLogService {
  stripSensitiveData(data) {
    if (!data) return data;
    if (typeof data !== 'object') return data;
    
    // Nếu là mảng, xử lý từng phần tử
    if (Array.isArray(data)) {
      return data.map(item => this.stripSensitiveData(item));
    }
    
    const sensitiveKeys = ['password', 'token', 'api_key', 'authorization', 'apikey', 'accesstoken', 'refreshtoken'];
    let cleanData = { ...data };
    
    for (const key of Object.keys(cleanData)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitiveKey => lowerKey.includes(sensitiveKey))) {
        cleanData[key] = '***';
      } else if (typeof cleanData[key] === 'object' && cleanData[key] !== null) {
        cleanData[key] = this.stripSensitiveData(cleanData[key]);
      }
    }
    return cleanData;
  }

  async logActivity(data) {
    try {
      if (data && data.details) {
        data.details = this.stripSensitiveData(data.details);
      }
      return await ActivityLogRepository.logActivity(data);
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Không ném lỗi ra ngoài để tránh làm gián đoạn luồng chính của ứng dụng
      return null;
    }
  }

  async getLogs(options) {
    try {
      return await ActivityLogRepository.getLogs(options);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ActivityLogService();
