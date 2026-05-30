-- New columns on transporteur_profiles for verification + vehicle types
ALTER TABLE public.transporteur_profiles
  ADD COLUMN IF NOT EXISTS vehicle_type text CHECK (vehicle_type IN ('camion_seul', 'plateau_barres', 'plateau', 'frigorifique', 'benne')),
  ADD COLUMN IF NOT EXISTS photo_carte_grise text,
  ADD COLUMN IF NOT EXISTS photo_autorisation text,
  ADD COLUMN IF NOT EXISTS photo_vehicule text,
  ADD COLUMN IF NOT EXISTS verification_status text CHECK (verification_status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Avatar on users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Storage bucket for transporteur documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('transporteur-docs', 'transporteur-docs', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Users can upload their documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'transporteur-docs' AND auth.role() = 'authenticated');

CREATE POLICY "Public document access"
ON storage.objects FOR SELECT
USING (bucket_id = 'transporteur-docs');

-- Storage bucket for profile avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
