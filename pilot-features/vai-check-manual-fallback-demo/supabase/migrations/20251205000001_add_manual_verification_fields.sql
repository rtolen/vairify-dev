-- Add manual verification fields to vai_check_sessions table
-- Feature: VAI CHECK Manual Verification Fallback

-- Create ENUM types for manual verification
DO $$ BEGIN
  CREATE TYPE verification_method_type AS ENUM ('automated', 'manual_fallback');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE manual_review_reason_type AS ENUM ('system_failure', 'individual_issue', 'failed_verification');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE manual_review_decision_type AS ENUM ('approved', 'rejected', 'pending');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add columns to vai_check_sessions
ALTER TABLE public.vai_check_sessions
  ADD COLUMN IF NOT EXISTS verification_method verification_method_type DEFAULT 'automated',
  ADD COLUMN IF NOT EXISTS manual_review_reason manual_review_reason_type,
  ADD COLUMN IF NOT EXISTS manual_reviewer_vai_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS manual_review_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS manual_review_decision manual_review_decision_type DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS manual_review_decided_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS owner_consent_timestamp TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS reviewer_consent_timestamp TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS liability_waiver_accepted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS manual_review_vai_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS manual_review_live_selfie_url TEXT,
  ADD COLUMN IF NOT EXISTS manual_review_notes TEXT;

-- Update status check constraint to include manual verification statuses
ALTER TABLE public.vai_check_sessions
  DROP CONSTRAINT IF EXISTS vai_check_sessions_status_check;

ALTER TABLE public.vai_check_sessions
  ADD CONSTRAINT vai_check_sessions_status_check CHECK (
    status = ANY (ARRAY[
      'initiated'::text, 
      'qr_shown'::text, 
      'profiles_viewed'::text, 
      'contract_review'::text, 
      'contract_signed'::text, 
      'final_verification'::text, 
      'completed'::text, 
      'failed'::text, 
      'declined'::text,
      'manual_review_pending'::text,
      'manual_review_approved'::text,
      'manual_review_rejected'::text
    ])
  );

-- Create indexes for manual verification queries
CREATE INDEX IF NOT EXISTS idx_vai_check_sessions_verification_method 
  ON public.vai_check_sessions(verification_method);

CREATE INDEX IF NOT EXISTS idx_vai_check_sessions_manual_review_decision 
  ON public.vai_check_sessions(manual_review_decision);

CREATE INDEX IF NOT EXISTS idx_vai_check_sessions_manual_reviewer_vai 
  ON public.vai_check_sessions(manual_reviewer_vai_number);

-- Create audit log table for manual verification actions
CREATE TABLE IF NOT EXISTS public.manual_verification_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.vai_check_sessions(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN (
    'manual_review_requested',
    'owner_consent_given',
    'reviewer_consent_given',
    'review_sent',
    'review_approved',
    'review_rejected',
    'liability_waiver_accepted'
  )),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_vai_number VARCHAR(20),
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on audit log
ALTER TABLE public.manual_verification_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit log
CREATE POLICY "Users can view audit logs for their sessions"
  ON public.manual_verification_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vai_check_sessions
      WHERE vai_check_sessions.id = manual_verification_audit_log.session_id
      AND (vai_check_sessions.provider_id = auth.uid() OR vai_check_sessions.client_id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all audit logs"
  ON public.manual_verification_audit_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_manual_verification_audit_log_session_id 
  ON public.manual_verification_audit_log(session_id);

CREATE INDEX IF NOT EXISTS idx_manual_verification_audit_log_user_id 
  ON public.manual_verification_audit_log(user_id);

CREATE INDEX IF NOT EXISTS idx_manual_verification_audit_log_created_at 
  ON public.manual_verification_audit_log(created_at DESC);

-- Comments for documentation
COMMENT ON COLUMN public.vai_check_sessions.verification_method IS 'Method used for verification: automated or manual_fallback';
COMMENT ON COLUMN public.vai_check_sessions.manual_review_reason IS 'Reason for manual review: system_failure, individual_issue, or failed_verification';
COMMENT ON COLUMN public.vai_check_sessions.manual_reviewer_vai_number IS 'VAI number of the user reviewing the manual verification';
COMMENT ON COLUMN public.vai_check_sessions.owner_consent_timestamp IS 'When the session owner (initiator) gave consent for manual verification';
COMMENT ON COLUMN public.vai_check_sessions.reviewer_consent_timestamp IS 'When the reviewer gave consent to review';
COMMENT ON COLUMN public.vai_check_sessions.liability_waiver_accepted IS 'Whether both parties accepted the liability waiver';


