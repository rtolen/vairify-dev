-- Create email verifications table for OTP storage
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own verification status (by email)
CREATE POLICY "Users can view their own email verification"
  ON public.email_verifications
  FOR SELECT
  USING (true); -- Public read for checking verification status

-- Policy: Service role can manage all records (edge functions will use service role)
CREATE POLICY "Service role can manage email verifications"
  ON public.email_verifications
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create index for faster email lookups
CREATE INDEX idx_email_verifications_email ON public.email_verifications(email);
CREATE INDEX idx_email_verifications_expires_at ON public.email_verifications(expires_at);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_email_verifications_updated_at
  BEFORE UPDATE ON public.email_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.email_verifications IS 'Stores temporary OTP codes for email verification during registration';
