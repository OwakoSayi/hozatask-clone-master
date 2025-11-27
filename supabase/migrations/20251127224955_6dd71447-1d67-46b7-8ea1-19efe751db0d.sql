-- Drop existing policies if they exist to recreate them
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- Allow anyone to view files in the avatars bucket (since it's public)
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload files to avatars bucket
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own files
CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);