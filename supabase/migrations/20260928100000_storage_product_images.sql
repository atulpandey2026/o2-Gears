-- ─── Storage: product-images bucket ─────────────────────────────────────────
-- Creates a public storage bucket for product, hero, and technology images
-- uploaded from the admin panel.

-- 1. Create bucket (idempotent via ON CONFLICT)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760, -- 10 MB per file
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/svg+xml'];

-- 2. RLS policies for storage.objects
-- Public read: anyone can view product images
DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
CREATE POLICY "product_images_public_read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Admin upload: only authenticated admins can insert
DROP POLICY IF EXISTS "product_images_admin_insert" ON storage.objects;
CREATE POLICY "product_images_admin_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admin update
DROP POLICY IF EXISTS "product_images_admin_update" ON storage.objects;
CREATE POLICY "product_images_admin_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admin delete
DROP POLICY IF EXISTS "product_images_admin_delete" ON storage.objects;
CREATE POLICY "product_images_admin_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
