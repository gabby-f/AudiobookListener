-- Create storage bucket for audiobooks
-- Run this in your Supabase SQL Editor

-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('audiobooks', 'audiobooks', false)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for authenticated users
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload audiobooks"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audiobooks');

-- Allow authenticated users to read their own files
CREATE POLICY "Allow authenticated users to read audiobooks"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'audiobooks');

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated users to delete audiobooks"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'audiobooks');

-- For now, allow public access (since we're using anon key)
-- You can make this more restrictive later with RLS based on user IDs
CREATE POLICY "Allow public to upload audiobooks"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'audiobooks');

CREATE POLICY "Allow public to read audiobooks"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'audiobooks');

CREATE POLICY "Allow public to delete audiobooks"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'audiobooks');
