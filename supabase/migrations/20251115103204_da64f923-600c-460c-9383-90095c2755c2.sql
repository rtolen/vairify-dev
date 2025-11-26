-- Create storage bucket for payment QR codes
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment_qr_codes', 'payment_qr_codes', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for payment QR codes
CREATE POLICY "Users can upload their own QR codes"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'payment_qr_codes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view their own QR codes"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'payment_qr_codes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anyone can view active payment QR codes"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'payment_qr_codes'
  );

CREATE POLICY "Users can delete their own QR codes"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'payment_qr_codes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );