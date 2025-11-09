-- Storage Buckets 初始化脚本
-- 注意：此脚本需要在 Supabase Dashboard 的 Storage 部分执行

-- ========================================
-- 1. 创建存储桶
-- ========================================

INSERT INTO storage.buckets (id, name, public) VALUES
  ('workflows', 'workflows', false),
  ('screenshots', 'screenshots', false),
  ('avatars', 'avatars', true),
  ('icons', 'icons', true)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 2. workflows 存储桶策略
-- ========================================

CREATE POLICY "Users can upload own workflow files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'workflows' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read own workflow files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'workflows' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own workflow files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'workflows' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ========================================
-- 3. screenshots 存储桶策略
-- ========================================

CREATE POLICY "Users can upload own screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'screenshots' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read own screenshots"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'screenshots' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own screenshots"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'screenshots' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ========================================
-- 4. avatars 存储桶策略（公开读）
-- ========================================

CREATE POLICY "Anyone can read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ========================================
-- 5. icons 存储桶策略（公开读）
-- ========================================

CREATE POLICY "Anyone can read icons"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'icons');

-- 管理员可以上传图标（可选，根据需求调整）
CREATE POLICY "Users can upload icons"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'icons');

