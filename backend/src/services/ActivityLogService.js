const ActivityLogRepository = require('../repositories/ActivityLogRepository');

class ActivityLogService {
  async logActivity(data) {
    try {
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
