const ActivityLogService = require('../services/ActivityLogService');

class ActivityLogController {
  async getLogs(req, res) {
    try {
      // Lấy query params
      const { page, limit, action, entity_type } = req.query;
      
      const result = await ActivityLogService.getLogs({
        page,
        limit,
        action,
        entity_type
      });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new ActivityLogController();
