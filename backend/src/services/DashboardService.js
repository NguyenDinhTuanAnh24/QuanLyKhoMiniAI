const DashboardRepository = require('../repositories/DashboardRepository');

class DashboardService {
  async getOverview(role) {
    return await DashboardRepository.getDashboardData(role);
  }
}

module.exports = new DashboardService();
