const { z } = require('zod');
const SupplierService = require('../services/SupplierService');

const supplierSchema = z.object({
  supplier_id: z.string().optional(),
  supplier_name: z.string().min(1, "Tên nhà cung cấp là bắt buộc"),
  phone: z.string().optional().nullable(),
  email: z.string().email("Email không hợp lệ").optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  status: z.string().optional()
});

class SupplierController {
  async getSuppliers(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = {
        search: req.query.search || '',
        status: req.query.status || ''
      };

      const { data, count } = await SupplierService.getSuppliers(filters, page, limit);

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

  async getSupplierById(req, res, next) {
    try {
      const supplier = await SupplierService.getSupplierById(req.params.id);
      res.status(200).json({
        success: true,
        data: supplier
      });
    } catch (error) {
      next(error);
    }
  }

  async createSupplier(req, res, next) {
    try {
      const validatedData = supplierSchema.parse(req.body);
      const newSupplier = await SupplierService.createSupplier(validatedData);
      res.status(201).json({
        success: true,
        data: newSupplier
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSupplier(req, res, next) {
    try {
      const validatedData = supplierSchema.parse(req.body);
      const updatedSupplier = await SupplierService.updateSupplier(req.params.id, validatedData);
      res.status(200).json({
        success: true,
        data: updatedSupplier
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteSupplier(req, res, next) {
    try {
      const deletedSupplier = await SupplierService.deleteSupplier(req.params.id);
      res.status(200).json({
        success: true,
        data: deletedSupplier
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SupplierController();
