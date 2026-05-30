-- Ban system for users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS banned boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ban_reason text;

-- Payment tracking for matchings
ALTER TABLE public.matchings
  ADD COLUMN IF NOT EXISTS paid boolean DEFAULT false;
