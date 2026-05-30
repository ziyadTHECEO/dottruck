-- Create storage bucket for voice messages
-- Run this in Supabase SQL editor or via CLI
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-messages', 'voice-messages', true)
ON CONFLICT DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Users can upload voice messages"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'voice-messages' AND auth.role() = 'authenticated');

-- Allow anyone to read voice messages
CREATE POLICY "Public voice message access"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice-messages');
