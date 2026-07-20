-- Supabase Schema for Smart Retail Inventory AI
-- Match with processed CSV files

DROP TABLE IF EXISTS public.stock_movements CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.suppliers CASCADE;
DROP TABLE IF EXISTS public.units CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- 1. Categories Table
CREATE TABLE public.categories (
    category_id TEXT PRIMARY KEY,
    category_name TEXT NOT NULL UNIQUE,
    category_name_en TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 2. Units Table
CREATE TABLE public.units (
    unit_id TEXT PRIMARY KEY,
    unit_name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 3. Suppliers Table
CREATE TABLE public.suppliers (
    supplier_id TEXT PRIMARY KEY,
    supplier_name TEXT NOT NULL,
    phone TEXT,
    email TEXT UNIQUE,
    address TEXT,
    note TEXT,
    status TEXT DEFAULT 'Đang hợp tác',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 4. Products Table
CREATE TABLE public.products (
    product_id TEXT PRIMARY KEY,
    sku TEXT NOT NULL UNIQUE,
    product_name TEXT NOT NULL,
    product_name_en TEXT,

    category_id TEXT REFERENCES public.categories(category_id),
    category_name TEXT,

    unit_id TEXT REFERENCES public.units(unit_id),
    unit_name TEXT,

    supplier_id TEXT REFERENCES public.suppliers(supplier_id),

    stock_quantity INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER NOT NULL DEFAULT 0,
    reorder_quantity INTEGER DEFAULT 0,

    import_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(12, 2) NOT NULL DEFAULT 0,

    date_received DATE,
    expiration_date DATE,
    warehouse_location TEXT,

    sales_90d INTEGER DEFAULT 0,
    avg_daily_sales_90d DECIMAL(10, 2) DEFAULT 0,
    forecast_14d INTEGER DEFAULT 0,
    suggested_import_quantity INTEGER DEFAULT 0,

    status TEXT DEFAULT 'Đang bán',
    source_row_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    CONSTRAINT chk_product_price_validity CHECK (import_price <= selling_price),
    CONSTRAINT chk_product_import_price_non_negative CHECK (import_price >= 0),
    CONSTRAINT chk_product_selling_price_non_negative CHECK (selling_price >= 0),
    CONSTRAINT chk_product_stock_non_negative CHECK (stock_quantity >= 0),
    CONSTRAINT chk_product_reorder_level_non_negative CHECK (reorder_level >= 0),
    CONSTRAINT chk_product_reorder_quantity_non_negative CHECK (reorder_quantity >= 0)
);

-- 5. Orders Table
CREATE TABLE public.orders (
    order_id TEXT PRIMARY KEY,
    order_code TEXT UNIQUE,
    customer_name TEXT,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    payment_method TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,

    CONSTRAINT chk_order_total_non_negative CHECK (total_amount >= 0)
);

-- 6. Order Items Table
CREATE TABLE public.order_items (
    order_item_id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES public.orders(order_id) ON DELETE CASCADE,
    product_id TEXT REFERENCES public.products(product_id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,

    CONSTRAINT chk_order_item_quantity_positive CHECK (quantity > 0),
    CONSTRAINT chk_order_item_unit_price_non_negative CHECK (unit_price >= 0),
    CONSTRAINT chk_order_item_subtotal_non_negative CHECK (subtotal >= 0)
);

-- 7. Stock Movements Table
CREATE TABLE public.stock_movements (
    movement_id TEXT PRIMARY KEY,
    product_id TEXT REFERENCES public.products(product_id),
    type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    old_quantity INTEGER,
    new_quantity INTEGER,
    unit_price DECIMAL(12, 2),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_stock_movement_type CHECK (type IN ('IMPORT', 'SALE', 'EXPORT', 'ADJUST')),
    CONSTRAINT chk_stock_movement_quantity_positive CHECK (quantity > 0),
    CONSTRAINT chk_stock_movement_old_quantity_non_negative CHECK (old_quantity IS NULL OR old_quantity >= 0),
    CONSTRAINT chk_stock_movement_new_quantity_non_negative CHECK (new_quantity IS NULL OR new_quantity >= 0),
    CONSTRAINT chk_stock_movement_unit_price_non_negative CHECK (unit_price IS NULL OR unit_price >= 0)
);

-- Indexes for performance
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_supplier ON public.products(supplier_id);
CREATE INDEX idx_products_unit ON public.products(unit_id);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_deleted_at ON public.products(deleted_at);
CREATE INDEX idx_products_stock ON public.products(stock_quantity, reorder_level);

CREATE INDEX idx_orders_created_at ON public.orders(created_at);

CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_product ON public.order_items(product_id);

CREATE INDEX idx_stock_movements_product ON public.stock_movements(product_id);
CREATE INDEX idx_stock_movements_type ON public.stock_movements(type);
CREATE INDEX idx_stock_movements_created_at ON public.stock_movements(created_at);

-- 8. App Users Table
CREATE TABLE public.app_users (
    user_id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'Nh�n vi�n b�n h�ng',
    status TEXT NOT NULL DEFAULT '�ang ho?t �?ng',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_app_users_email ON public.app_users(email);
CREATE INDEX idx_app_users_status ON public.app_users(status);



-- 9. Settings Table
CREATE TABLE public.settings (
    id TEXT PRIMARY KEY DEFAULT 'DEFAULT',
    store_name TEXT DEFAULT 'C?a h�ng c?a t�i',
    store_phone TEXT DEFAULT '',
    store_email TEXT DEFAULT '',
    store_address TEXT DEFAULT '',
    store_logo_url TEXT DEFAULT '',
    low_stock_warning_days INTEGER DEFAULT 14,
    default_reorder_level INTEGER DEFAULT 10,
    auto_stock_alert_enabled BOOLEAN DEFAULT true,
    allow_negative_stock BOOLEAN DEFAULT false,
    ai_enabled BOOLEAN DEFAULT true,
    ai_provider TEXT DEFAULT 'Google Gemini',
    ai_model TEXT DEFAULT 'gemini-1.5-pro',
    forecast_days INTEGER DEFAULT 14,
    payos_enabled BOOLEAN DEFAULT true,
    bank_name TEXT DEFAULT '',
    bank_account_no TEXT DEFAULT '',
    bank_account_name TEXT DEFAULT '',
    currency TEXT DEFAULT 'VND',
    date_format TEXT DEFAULT 'DD/MM/YYYY',
    maintenance_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default settings
INSERT INTO public.settings (id, store_name, store_phone, store_email, store_address)
VALUES ('DEFAULT', 'Smart Retail Mini', '0123456789', 'admin@smartretail.com', '123 Smart Retail St.')
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------
-- Table structure for table `notifications`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL DEFAULT 'ALL',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('ORDER_NEW', 'PAYMENT_SUCCESS', 'STOCK_LOW', 'STOCK_IMPORT', 'STOCK_EXPORT')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    related_link VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type_created ON public.notifications(type, created_at DESC);

-- --------------------------------------------------------
-- Table structure for table `activity_logs`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.app_users(user_id) ON DELETE SET NULL,
    user_name TEXT, -- To easily show who did it even if the user is deleted
    action VARCHAR(255) NOT NULL, -- 'LOGIN', 'CREATE_PRODUCT', 'UPDATE_PRODUCT', 'DELETE_PRODUCT', 'IMPORT_STOCK', 'EXPORT_STOCK', 'CREATE_ORDER', 'UPDATE_SETTING'
    entity_type VARCHAR(255), -- 'PRODUCT', 'ORDER', 'USER', 'SETTING'
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);
