const DashboardService = require('../services/DashboardService');

class DashboardController {
  async getOverview(req, res, next) {
    try {
      const data = await DashboardService.getOverview();
      
      res.json({
        success: true,
        data: data
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
