const UnitRepository = require('../repositories/UnitRepository');
const ProductRepository = require('../repositories/ProductRepository');
const { BusinessException } = require('../middleware/errorHandler');

class UnitService {
  async getUnits(filters, page, limit) {
    return await UnitRepository.findAndCountAll(filters, page, limit);
  }

  async getUnitById(id) {
    const unit = await UnitRepository.findById(id);
    if (!unit) {
      throw new BusinessException('NOT_FOUND', 'Unit not found');
    }
    return unit;
  }

  async createUnit(data) {
    if (!data.unit_id) {
      data.unit_id = `UNIT-${Date.now()}`;
    }
    try {
      return await UnitRepository.create(data);
    } catch (error) {
      if (error.code === '23505') {
        throw new BusinessException('DUPLICATE_NAME', 'Tên đơn vị tính đã tồn tại.');
      }
      throw error;
    }
  }

  async updateUnit(id, data) {
    const existing = await UnitRepository.findById(id);
    if (!existing) {
      throw new BusinessException('NOT_FOUND', 'Unit not found');
    }
    try {
      return await UnitRepository.update(id, data);
    } catch (error) {
      if (error.code === '23505') {
        throw new BusinessException('DUPLICATE_NAME', 'Tên đơn vị tính đã tồn tại.');
      }
      throw error;
    }
  }

  async deleteUnit(id) {
    const existing = await UnitRepository.findById(id);
    if (!existing) {
      throw new BusinessException('NOT_FOUND', 'Unit not found');
    }

    // Check referential integrity
    const { count } = await ProductRepository.findAndCountAll({ unit_id: id }, 1, 1);
    if (count > 0) {
      throw new BusinessException('IN_USE', 'Không thể xóa đơn vị tính này vì đang có sản phẩm sử dụng.');
    }

    return await UnitRepository.softDelete(id);
  }
}

module.exports = new UnitService();
