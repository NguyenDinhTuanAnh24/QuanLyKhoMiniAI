const { z } = require('zod');
const CategoryService = require('../services/CategoryService');
const { ValidationException } = require('../middleware/errorHandler');

const categorySchema = z.object({
  category_id: z.string().optional(),
  category_name: z.string().min(1, "Tên danh mục là bắt buộc"),
  category_name_en: z.string().optional().nullable(),
  description: z.string().optional().nullable()
});

class CategoryController {
  async getCategories(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = {
        search: req.query.search || '',
      };

      const { data, count } = await CategoryService.getCategories(filters, page, limit);

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

  async getCategoryById(req, res, next) {
    try {
      const category = await CategoryService.getCategoryById(req.params.id);
      res.status(200).json({
        success: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req, res, next) {
    try {
      const validatedData = categorySchema.parse(req.body);
      const newCategory = await CategoryService.createCategory(validatedData);
      res.status(201).json({
        success: true,
        data: newCategory
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const validatedData = categorySchema.parse(req.body);
      const updatedCategory = await CategoryService.updateCategory(req.params.id, validatedData);
      res.status(200).json({
        success: true,
        data: updatedCategory
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      const deletedCategory = await CategoryService.deleteCategory(req.params.id);
      res.status(200).json({
        success: true,
        data: deletedCategory
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CategoryController();
