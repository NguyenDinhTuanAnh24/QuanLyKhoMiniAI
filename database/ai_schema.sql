-- Supabase Schema for AI Inventory Forecast Module

CREATE TABLE IF NOT EXISTS public.ai_analysis_runs (
    run_id TEXT PRIMARY KEY,
    run_type TEXT,
    provider TEXT,
    model TEXT,
    status TEXT,
    summary TEXT,
    total_products INTEGER,
    total_recommendations INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_recommendations (
    recommendation_id TEXT PRIMARY KEY,
    run_id TEXT REFERENCES public.ai_analysis_runs(run_id) ON DELETE CASCADE,
    product_id TEXT REFERENCES public.products(product_id) ON DELETE CASCADE,
    product_name TEXT,
    sku TEXT,
    category_name TEXT,
    supplier_name TEXT,
    unit_name TEXT,
    stock_quantity NUMERIC,
    reorder_level NUMERIC,
    sales_90d NUMERIC,
    avg_daily_sales_90d NUMERIC,
    forecast_14d NUMERIC,
    suggested_import_quantity NUMERIC,
    priority TEXT,
    reason TEXT,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_recs_run_id ON public.ai_recommendations(run_id);
CREATE INDEX IF NOT EXISTS idx_ai_recs_status ON public.ai_recommendations(status);
