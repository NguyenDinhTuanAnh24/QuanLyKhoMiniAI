const ProductService = require('../services/ProductService');
const { z } = require('zod');

// Validation schemas
const productSchema = z.object({
  product_id: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  product_name: z.string().min(1, 'Name is required'),
  product_name_en: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  category_id: z.string().min(1, 'Invalid Category ID'),
  category_name: z.string().optional().nullable(),
  unit_id: z.string().min(1, 'Invalid Unit ID'),
  unit_name: z.string().optional().nullable(),
  supplier_id: z.string().min(1, 'Invalid Supplier ID'),
  import_price: z.number().min(0),
  selling_price: z.number().min(0),
  stock_quantity: z.number().int().min(0).default(0),
  reorder_level: z.number().int().min(0).default(0),
  reorder_quantity: z.number().int().min(0).default(0),
  date_received: z.string().optional().nullable(),
  expiration_date: z.string().optional().nullable(),
  warehouse_location: z.string().optional().nullable(),
  sales_90d: z.number().int().min(0).default(0),
  avg_daily_sales_90d: z.number().min(0).default(0),
  forecast_14d: z.number().int().min(0).default(0),
  suggested_import_quantity: z.number().int().min(0).default(0),
  status: z.string().default('Active'),
  source_row_count: z.number().int().min(0).default(0)
});

const productUpdateSchema = productSchema.partial();

class ProductController {
  async getProducts(req, res, next) {
    try {
      const { search, category_id, supplier_id, status, page = 1, limit = 10 } = req.query;
      const filters = { search, category_id, supplier_id, status };
      
      const { data, count } = await ProductService.getProducts(filters, parseInt(page), parseInt(limit));
      
      res.json({
        success: true,
        data,
        meta: {
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            totalPages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req, res, next) {
    try {
      const product = await ProductService.getProductById(req.params.id);
      res.json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req, res, next) {
    try {
      const validatedData = productSchema.parse(req.body);
      const product = await ProductService.createProduct(validatedData);
      
      const ActivityLogService = require('../services/ActivityLogService');
      await ActivityLogService.logActivity({
        user_id: req.user ? req.user.user_id : null,
        user_name: req.user ? req.user.full_name : 'Unknown',
        action: 'CREATE_PRODUCT',
        entity_type: 'PRODUCT',
        entity_id: product.product_id,
        details: { role: req.user.role, status: 'Thành công', sku: product.sku, name: product.product_name }
      });
      
      res.status(201).json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const validatedData = productUpdateSchema.parse(req.body);
      const product = await ProductService.updateProduct(req.params.id, validatedData);
      
      const ActivityLogService = require('../services/ActivityLogService');
      await ActivityLogService.logActivity({
        user_id: req.user ? req.user.user_id : null,
        user_name: req.user ? req.user.full_name : 'Unknown',
        action: 'UPDATE_PRODUCT',
        entity_type: 'PRODUCT',
        entity_id: product.product_id,
        details: { role: req.user.role, status: 'Thành công', name: product.product_name }
      });
      
      res.json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      await ProductService.deleteProduct(req.params.id);
      
      const ActivityLogService = require('../services/ActivityLogService');
      await ActivityLogService.logActivity({
        user_id: req.user ? req.user.user_id : null,
        user_name: req.user ? req.user.full_name : 'Unknown',
        action: 'DELETE_PRODUCT',
        entity_type: 'PRODUCT',
        entity_id: req.params.id,
        details: { role: req.user.role, status: 'Thành công',}
      });
      
      res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async uploadProductImage(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn ảnh' });
      }

      const { id } = req.params;
      const file = req.file;

      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return res.status(400).json({ success: false, message: 'Chỉ hỗ trợ ảnh PNG, JPG hoặc WEBP' });
      }

      const data = await ProductService.uploadProductImage(id, file);

      res.json({
        success: true,
        message: 'Upload ảnh sản phẩm thành công',
        data: {
          product_id: data.product_id,
          image_url: data.image_url
        }
      });
    } catch (error) {
      console.error("Upload product image error:", error);
      if (error.code === 'PRODUCT_NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
      }
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }
}

module.exports = new ProductController();
