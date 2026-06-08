const ProductService = require('../services/ProductService');
const { z } = require('zod');

// Validation schemas
const productSchema = z.object({
  product_id: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  product_name: z.string().min(1, 'Name is required'),
  product_name_en: z.string().optional().nullable(),
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
      res.status(201).json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const validatedData = productUpdateSchema.parse(req.body);
      const product = await ProductService.updateProduct(req.params.id, validatedData);
      res.json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      await ProductService.deleteProduct(req.params.id);
      res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
