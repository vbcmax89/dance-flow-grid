-- Add structured detail fields to eventi table
ALTER TABLE public.eventi
  ADD COLUMN IF NOT EXISTS location      TEXT,
  ADD COLUMN IF NOT EXISTS styles        TEXT,
  ADD COLUMN IF NOT EXISTS website_url   TEXT,
  ADD COLUMN IF NOT EXISTS pass_url      TEXT;
