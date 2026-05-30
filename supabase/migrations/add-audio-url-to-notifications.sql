-- Add audio_url column for voice messages in notifications
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Remove any existing CHECK constraint on type column (could be auto-named)
DO $$
DECLARE
  cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'public.notifications'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%type%'
  LIMIT 1;

  IF cname IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.notifications DROP CONSTRAINT ' || quote_ident(cname);
  END IF;
END $$;

-- Add updated CHECK constraint with verification types
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'nouvelle_charge', 'message_recu', 'matching_accepte', 'matching_refuse',
    'charge_completee', 'rating_recu', 'partenaire_trouve',
    'verification_approved', 'verification_rejected', 'verification_resend'
  ));
