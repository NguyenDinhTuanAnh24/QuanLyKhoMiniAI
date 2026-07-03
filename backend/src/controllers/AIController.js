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
