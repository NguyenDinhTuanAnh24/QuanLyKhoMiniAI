const AIService = require('../services/AIService');

class AIController {
  async getForecast(req, res, next) {
    try {
      const filters = {
        search: req.query.search,
        category: req.query.category,
        risk: req.query.risk,
        limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined
      };

      const result = await AIService.generateForecast(filters);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getForecastTable(req, res, next) {
    try {
      const filters = {
        search: req.query.search,
        category: req.query.category,
        risk: req.query.risk
      };
      const page = req.query.page ? parseInt(req.query.page, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 5;

      const result = await AIService.getForecastTable(filters, page, limit);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getForecastSuggestions(req, res, next) {
    try {
      const page = req.query.page ? parseInt(req.query.page, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 8;

      const result = await AIService.getForecastSuggestions(page, limit);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async recalculateForecast(req, res, next) {
    try {
      // In a real app, this might update the database
      // For now, we just return success
      res.json({
        success: true,
        message: 'Recalculation started or completed'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AIController();
