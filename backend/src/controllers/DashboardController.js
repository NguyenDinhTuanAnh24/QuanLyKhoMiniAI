const DashboardService = require('../services/DashboardService');

class DashboardController {
  async getOverview(req, res, next) {
    try {
      const role = req.user?.role;
      const data = await DashboardService.getOverview(role);
      
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
