const SupplierRepository = require('../repositories/SupplierRepository');
const ProductRepository = require('../repositories/ProductRepository');
const { BusinessException } = require('../middleware/errorHandler');

class SupplierService {
  async getSuppliers(filters, page, limit) {
    return await SupplierRepository.findAndCountAll(filters, page, limit);
  }

  async getSupplierById(id) {
    const supplier = await SupplierRepository.findById(id);
    if (!supplier) {
      throw new BusinessException('NOT_FOUND', 'Supplier not found');
    }
    return supplier;
  }

  async createSupplier(data) {
    if (!data.supplier_id) {
      data.supplier_id = `SUP-${Date.now()}`;
    }
    // Convert empty string email to null to prevent UNIQUE constraint violation on empty strings
    if (data.email === '') {
      data.email = null;
    }

    try {
      return await SupplierRepository.create(data);
    } catch (error) {
      if (error.code === '23505') {
        throw new BusinessException('DUPLICATE_EMAIL', 'Email nhà cung cấp đã tồn tại.');
      }
      throw error;
    }
  }

  async updateSupplier(id, data) {
    const existing = await SupplierRepository.findById(id);
    if (!existing) {
      throw new BusinessException('NOT_FOUND', 'Supplier not found');
    }

    if (data.email === '') {
      data.email = null;
    }

    try {
      return await SupplierRepository.update(id, data);
    } catch (error) {
      if (error.code === '23505') {
        throw new BusinessException('DUPLICATE_EMAIL', 'Email nhà cung cấp đã tồn tại.');
      }
      throw error;
    }
  }

  async deleteSupplier(id) {
    const existing = await SupplierRepository.findById(id);
    if (!existing) {
      throw new BusinessException('NOT_FOUND', 'Supplier not found');
    }

    // Check referential integrity
    const { count } = await ProductRepository.findAndCountAll({ supplier_id: id }, 1, 1);
    if (count > 0) {
      throw new BusinessException('IN_USE', 'Không thể xóa nhà cung cấp này vì đang có sản phẩm sử dụng.');
    }

    return await SupplierRepository.softDelete(id);
  }
}

module.exports = new SupplierService();
