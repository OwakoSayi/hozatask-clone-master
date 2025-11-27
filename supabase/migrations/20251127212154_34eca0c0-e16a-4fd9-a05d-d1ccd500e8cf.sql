-- Allow anyone to upload images to supplier-images folder
CREATE POLICY "Allow public uploads to supplier-images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'supplier-images'
);

-- Allow anyone to view images in supplier-images folder
CREATE POLICY "Allow public access to supplier-images"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'supplier-images'
);