const ProductRepository = require('../repositories/ProductRepository');
const { BusinessException } = require('../middleware/errorHandler');

class ProductService {
  async getProducts(filters, page, limit) {
    return await ProductRepository.findAndCountAll(filters, page, limit);
  }

  async getProductById(id) {
    const product = await ProductRepository.findById(id);
    if (!product) {
      throw new BusinessException('PRODUCT_NOT_FOUND', 'Product not found');
    }
    return product;
  }

  async createProduct(productData) {
    if (!productData.product_id) {
      productData.product_id = `PRD-${Date.now()}`;
    }

    // Validate business rule: import_price <= selling_price
    if (productData.import_price > productData.selling_price) {
      throw new BusinessException(
        'INVALID_PRICE',
        'Import price must not exceed selling price'
      );
    }

    // Validate business rule: stock_quantity >= 0
    if (productData.stock_quantity < 0) {
      throw new BusinessException(
        'INVALID_STOCK',
        'Stock quantity cannot be negative'
      );
    }

    // Check SKU uniqueness
    const existingProduct = await ProductRepository.findBySku(productData.sku);
    if (existingProduct) {
      throw new BusinessException('DUPLICATE_SKU', 'SKU must be globally unique');
    }

    return await ProductRepository.create(productData);
  }

  async updateProduct(id, productData) {
    // Validate business rule: import_price <= selling_price
    if (productData.import_price > productData.selling_price) {
      throw new BusinessException(
        'INVALID_PRICE',
        'Import price must not exceed selling price'
      );
    }

    // Validate business rule: stock_quantity >= 0
    if (productData.stock_quantity !== undefined && productData.stock_quantity < 0) {
      throw new BusinessException(
        'INVALID_STOCK',
        'Stock quantity cannot be negative'
      );
    }

    // Check if product exists
    const existingProduct = await ProductRepository.findById(id);
    if (!existingProduct) {
      throw new BusinessException('PRODUCT_NOT_FOUND', 'Product not found');
    }

    // Check SKU uniqueness if SKU is being updated
    if (productData.sku && productData.sku !== existingProduct.sku) {
      const skuExists = await ProductRepository.findBySku(productData.sku);
      if (skuExists) {
        throw new BusinessException('DUPLICATE_SKU', 'SKU must be globally unique');
      }
    }

    return await ProductRepository.update(id, productData);
  }

  async deleteProduct(id) {
    const existingProduct = await ProductRepository.findById(id);
    if (!existingProduct) {
      throw new BusinessException('PRODUCT_NOT_FOUND', 'Product not found');
    }
    return await ProductRepository.softDelete(id);
  }
}

module.exports = new ProductService();
