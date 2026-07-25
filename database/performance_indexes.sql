-- Tối ưu hóa hiệu năng truy vấn cho Smart Retail Inventory AI
-- Thêm các chỉ mục (indexes) vào các cột thường xuyên được sử dụng trong WHERE, ORDER BY, và JOIN

-- 1. Bảng products
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at);

-- 2. Bảng orders
CREATE INDEX IF NOT EXISTS idx_orders_customer_name ON orders(customer_name);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- 3. Bảng order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- 4. Bảng stock_movements
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);

-- 5. RPC cho Thống kê tiêu thụ sản phẩm (Tránh N+1 và tràn RAM ở backend)
CREATE OR REPLACE FUNCTION get_product_consumption(p_limit INT DEFAULT 10)
RETURNS TABLE (
    product_id TEXT, -- Note: Type matches schema
    product_name TEXT,
    sku TEXT,
    quantity_sold BIGINT,
    total_revenue NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.product_id,
        p.product_name,
        p.sku,
        SUM(oi.quantity)::BIGINT AS quantity_sold,
        SUM(oi.quantity * oi.unit_price)::NUMERIC AS total_revenue
    FROM order_items oi
    JOIN products p ON oi.product_id = p.product_id
    GROUP BY p.product_id, p.product_name, p.sku
    ORDER BY quantity_sold DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
