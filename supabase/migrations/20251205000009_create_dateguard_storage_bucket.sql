-- Create storage bucket for DateGuard pre-activation photos
-- This migration should be run manually in Supabase Dashboard or via Supabase CLI

-- Note: Storage buckets are created via Supabase Storage API, not SQL
-- Run this in Supabase Dashboard > Storage > Create Bucket:
-- Bucket name: dateguard-pre-activation
-- Public: false (private bucket)
-- File size limit: 10MB
-- Allowed MIME types: image/*

-- RLS Policies for the bucket (run after bucket is created)
-- These will be applied automatically when the bucket is created via Supabase Dashboard

-- Policy: Users can upload their own photos
-- CREATE POLICY "Users can upload to dateguard-pre-activation"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'dateguard-pre-activation' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- Policy: Users can view their own photos
-- CREATE POLICY "Users can view their own photos"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'dateguard-pre-activation' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- Policy: Users can delete their own photos
-- CREATE POLICY "Users can delete their own photos"
--   ON storage.objects FOR DELETE
--   USING (
--     bucket_id = 'dateguard-pre-activation' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- Note: This file is for documentation only
-- Actual bucket creation must be done via Supabase Dashboard or Storage API


