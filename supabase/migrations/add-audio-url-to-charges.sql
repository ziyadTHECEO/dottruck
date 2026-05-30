-- Add audio_url column to charges table for voice messages on cargo listings
ALTER TABLE public.charges
  ADD COLUMN IF NOT EXISTS audio_url TEXT;
