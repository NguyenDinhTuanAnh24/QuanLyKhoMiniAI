-- us-37_ai_recommendation_apply.sql
-- Thêm các trường theo dõi cho ai_recommendations
ALTER TABLE public.ai_recommendations
ADD COLUMN IF NOT EXISTS action_type TEXT DEFAULT 'REORDER_STOCK',
ADD COLUMN IF NOT EXISTS applied_by TEXT,
ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS application_type TEXT,
ADD COLUMN IF NOT EXISTS application_id TEXT;

-- Bảng import_plans
CREATE TABLE IF NOT EXISTS public.import_plans (
    id TEXT PRIMARY KEY,
    status TEXT DEFAULT 'DRAFT', -- DRAFT, COMPLETED, CANCELLED
    source TEXT DEFAULT 'AI',
    source_run_id TEXT REFERENCES public.ai_analysis_runs(run_id) ON DELETE SET NULL,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Bảng import_plan_items
CREATE TABLE IF NOT EXISTS public.import_plan_items (
    id TEXT PRIMARY KEY,
    plan_id TEXT REFERENCES public.import_plans(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES public.products(product_id) ON DELETE CASCADE,
    supplier_id TEXT REFERENCES public.suppliers(supplier_id) ON DELETE SET NULL,
    suggested_quantity NUMERIC,
    actual_quantity NUMERIC,
    ai_recommendation_id TEXT UNIQUE REFERENCES public.ai_recommendations(recommendation_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_import_plans_status ON public.import_plans(status);
CREATE INDEX IF NOT EXISTS idx_import_plan_items_plan_id ON public.import_plan_items(plan_id);
