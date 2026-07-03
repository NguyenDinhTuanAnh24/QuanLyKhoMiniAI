const DashboardRepository = require('../repositories/DashboardRepository');

class DashboardService {
  async getOverview() {
    return await DashboardRepository.getDashboardData();
  }
}

module.exports = new DashboardService();
