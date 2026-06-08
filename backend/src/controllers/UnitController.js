const { z } = require('zod');
const UnitService = require('../services/UnitService');

const unitSchema = z.object({
  unit_id: z.string().optional(),
  unit_name: z.string().min(1, "Tên đơn vị tính là bắt buộc"),
  description: z.string().optional().nullable()
});

class UnitController {
  async getUnits(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = {
        search: req.query.search || '',
      };

      const { data, count } = await UnitService.getUnits(filters, page, limit);

      res.status(200).json({
        success: true,
        data,
        meta: {
          pagination: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getUnitById(req, res, next) {
    try {
      const unit = await UnitService.getUnitById(req.params.id);
      res.status(200).json({
        success: true,
        data: unit
      });
    } catch (error) {
      next(error);
    }
  }

  async createUnit(req, res, next) {
    try {
      const validatedData = unitSchema.parse(req.body);
      const newUnit = await UnitService.createUnit(validatedData);
      res.status(201).json({
        success: true,
        data: newUnit
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUnit(req, res, next) {
    try {
      const validatedData = unitSchema.parse(req.body);
      const updatedUnit = await UnitService.updateUnit(req.params.id, validatedData);
      res.status(200).json({
        success: true,
        data: updatedUnit
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUnit(req, res, next) {
    try {
      const deletedUnit = await UnitService.deleteUnit(req.params.id);
      res.status(200).json({
        success: true,
        data: deletedUnit
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UnitController();
