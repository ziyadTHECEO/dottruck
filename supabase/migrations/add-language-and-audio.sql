-- Add language preference to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'ar';

-- Add audio_url to messages table for voice messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Make contenu nullable (voice-only messages may not have text)
ALTER TABLE public.messages ALTER COLUMN contenu DROP NOT NULL;
