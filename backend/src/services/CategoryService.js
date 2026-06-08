const CategoryRepository = require('../repositories/CategoryRepository');
const ProductRepository = require('../repositories/ProductRepository');
const { BusinessException } = require('../middleware/errorHandler');

class CategoryService {
  async getCategories(filters, page, limit) {
    return await CategoryRepository.findAndCountAll(filters, page, limit);
  }

  async getCategoryById(id) {
    const category = await CategoryRepository.findById(id);
    if (!category) {
      throw new BusinessException('NOT_FOUND', 'Category not found');
    }
    return category;
  }

  async createCategory(data) {
    if (!data.category_id) {
      data.category_id = `CAT-${Date.now()}`;
    }
    try {
      return await CategoryRepository.create(data);
    } catch (error) {
      if (error.code === '23505') {
        throw new BusinessException('DUPLICATE_NAME', 'Tên danh mục đã tồn tại.');
      }
      throw error;
    }
  }

  async updateCategory(id, data) {
    const existing = await CategoryRepository.findById(id);
    if (!existing) {
      throw new BusinessException('NOT_FOUND', 'Category not found');
    }
    try {
      return await CategoryRepository.update(id, data);
    } catch (error) {
      if (error.code === '23505') {
        throw new BusinessException('DUPLICATE_NAME', 'Tên danh mục đã tồn tại.');
      }
      throw error;
    }
  }

  async deleteCategory(id) {
    const existing = await CategoryRepository.findById(id);
    if (!existing) {
      throw new BusinessException('NOT_FOUND', 'Category not found');
    }

    // Check referential integrity
    const { count } = await ProductRepository.findAndCountAll({ category_id: id }, 1, 1);
    if (count > 0) {
      throw new BusinessException('IN_USE', 'Không thể xóa danh mục này vì đang có sản phẩm sử dụng.');
    }

    return await CategoryRepository.softDelete(id);
  }
}

module.exports = new CategoryService();
