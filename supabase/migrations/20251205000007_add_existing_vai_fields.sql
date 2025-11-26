-- Add fields to signup_sessions for existing VAI number flow
-- Feature: Existing VAI Number Integration with ChainPass

ALTER TABLE public.signup_sessions
  ADD COLUMN IF NOT EXISTS has_existing_vai BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS existing_vai_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS chainpass_response JSONB,
  ADD COLUMN IF NOT EXISTS vai_status VARCHAR(50) CHECK (vai_status IN ('fully_qualified', 'missing_requirements', 'invalid', 'pending_check')),
  ADD COLUMN IF NOT EXISTS payment_expiration TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS requirements_status JSONB DEFAULT '{}'::jsonb;

-- Create index for existing VAI lookups
CREATE INDEX IF NOT EXISTS idx_signup_sessions_existing_vai 
  ON public.signup_sessions(existing_vai_number) 
  WHERE existing_vai_number IS NOT NULL;

-- Comments
COMMENT ON COLUMN public.signup_sessions.has_existing_vai IS 'User indicated they have a VAI from another platform';
COMMENT ON COLUMN public.signup_sessions.existing_vai_number IS 'Existing VAI number provided by user';
COMMENT ON COLUMN public.signup_sessions.chainpass_response IS 'Full response from ChainPass /check-vai-requirements endpoint';
COMMENT ON COLUMN public.signup_sessions.vai_status IS 'Status from ChainPass: fully_qualified, missing_requirements, or invalid';
COMMENT ON COLUMN public.signup_sessions.payment_expiration IS 'Payment expiration date from ChainPass response';
COMMENT ON COLUMN public.signup_sessions.requirements_status IS 'Requirements status object from ChainPass response';


