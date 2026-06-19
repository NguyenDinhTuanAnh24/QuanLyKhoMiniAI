const ReportService = require('../services/ReportService');

class ReportController {
  async getOverview(req, res, next) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        categoryId: req.query.categoryId,
        supplierId: req.query.supplierId
      };
      const data = await ReportService.getOverview(filters);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getRevenue(req, res, next) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        categoryId: req.query.categoryId,
        supplierId: req.query.supplierId
      };
      const data = await ReportService.getRevenueReport(filters);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getInventory(req, res, next) {
    try {
      const filters = {
        categoryId: req.query.categoryId,
        supplierId: req.query.supplierId
      };
      const data = await ReportService.getInventoryReport(filters);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getStockMovements(req, res, next) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        categoryId: req.query.categoryId,
        supplierId: req.query.supplierId
      };
      const data = await ReportService.getStockMovementsReport(filters);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getTopSelling(req, res, next) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        categoryId: req.query.categoryId,
        supplierId: req.query.supplierId,
        limit: req.query.limit ? parseInt(req.query.limit, 10) : 10
      };
      const data = await ReportService.getTopSellingReport(filters);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getImports(req, res, next) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        categoryId: req.query.categoryId,
        supplierId: req.query.supplierId
      };
      const data = await ReportService.getImportsReport(filters);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Giữ lại nếu cần thiết
  async getSlowSelling(req, res, next) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        categoryId: req.query.categoryId,
        supplierId: req.query.supplierId,
        limit: req.query.limit ? parseInt(req.query.limit, 10) : 10
      };
      const data = await ReportService.getSlowSelling(filters);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ReportController();
