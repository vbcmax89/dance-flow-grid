-- Make sala_id nullable and add event_type for special full-width events
ALTER TABLE public.stages ALTER COLUMN sala_id DROP NOT NULL;
ALTER TABLE public.stages ADD COLUMN IF NOT EXISTS event_type TEXT;
ALTER TABLE public.stages ADD COLUMN IF NOT EXISTS is_full_width BOOLEAN NOT NULL DEFAULT false;