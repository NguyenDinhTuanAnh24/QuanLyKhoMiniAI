-- US-35 Notification System Migration

-- 1. Drop existing check constraint on type if it exists (we will enforce at application level, or create a broader one)
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 2. Add new columns to notifications
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS severity VARCHAR(50) DEFAULT 'INFO',
ADD COLUMN IF NOT EXISTS related_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS related_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS created_by VARCHAR(50),
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS dedup_key VARCHAR(255);

-- 3. Add UNIQUE constraint for dedup_key (ignoring nulls by default in Postgres)
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS uq_notifications_dedup_key;
ALTER TABLE public.notifications ADD CONSTRAINT uq_notifications_dedup_key UNIQUE (dedup_key);

-- 4. Create notification_recipients table
CREATE TABLE IF NOT EXISTS public.notification_recipients (
    id VARCHAR(50) PRIMARY KEY,
    notification_id VARCHAR(50) NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL REFERENCES public.app_users(user_id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_notification_user UNIQUE (notification_id, user_id)
);

-- 5. Create necessary indexes
CREATE INDEX IF NOT EXISTS idx_notif_recipients_user ON public.notification_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_recipients_user_read ON public.notification_recipients(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_dedup ON public.notifications(dedup_key);
CREATE INDEX IF NOT EXISTS idx_notifications_related ON public.notifications(related_type, related_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- 6. Clean up old unused columns from notifications (Optional but recommended to prevent confusion)
-- ALTER TABLE public.notifications DROP COLUMN IF EXISTS user_id;
-- ALTER TABLE public.notifications DROP COLUMN IF EXISTS is_read;
-- ALTER TABLE public.notifications DROP COLUMN IF EXISTS related_link;
