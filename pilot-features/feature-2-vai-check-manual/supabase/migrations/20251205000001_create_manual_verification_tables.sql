-- Create manual_verifications table for manual verification fallback
CREATE TABLE IF NOT EXISTS public.manual_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.vai_check_sessions(id) ON DELETE CASCADE,
  initiator_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  failure_reason TEXT NOT NULL CHECK (failure_reason IN ('system_glitch', 'cant_verify', 'failed_check')),
  failure_details TEXT,
  vai_photo_url TEXT NOT NULL,
  live_selfie_url TEXT NOT NULL,
  initiator_consent BOOLEAN NOT NULL DEFAULT false,
  reviewer_consent BOOLEAN NOT NULL DEFAULT false,
  initiator_consent_at TIMESTAMP WITH TIME ZONE,
  reviewer_consent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  reviewer_decision TEXT CHECK (reviewer_decision IN ('approved', 'rejected') OR reviewer_decision IS NULL),
  reviewer_notes TEXT,
  liability_waiver_accepted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

-- Create verification_audit_log table for audit trail
CREATE TABLE IF NOT EXISTS public.verification_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL REFERENCES public.manual_verifications(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'consent_given', 'reviewed', 'approved', 'rejected', 'expired')),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.manual_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for manual_verifications
CREATE POLICY "Users can view their own manual verifications"
  ON public.manual_verifications FOR SELECT
  USING (auth.uid() = initiator_user_id OR auth.uid() = reviewer_user_id);

CREATE POLICY "Users can create their own manual verifications"
  ON public.manual_verifications FOR INSERT
  WITH CHECK (auth.uid() = initiator_user_id);

CREATE POLICY "Users can update their own manual verifications"
  ON public.manual_verifications FOR UPDATE
  USING (auth.uid() = initiator_user_id OR auth.uid() = reviewer_user_id)
  WITH CHECK (auth.uid() = initiator_user_id OR auth.uid() = reviewer_user_id);

-- RLS Policies for verification_audit_log
CREATE POLICY "Users can view audit logs for their verifications"
  ON public.verification_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.manual_verifications
      WHERE manual_verifications.id = verification_audit_log.verification_id
      AND (manual_verifications.initiator_user_id = auth.uid() OR manual_verifications.reviewer_user_id = auth.uid())
    )
  );

-- Create indexes
CREATE INDEX idx_manual_verifications_session_id ON public.manual_verifications(session_id);
CREATE INDEX idx_manual_verifications_initiator_user_id ON public.manual_verifications(initiator_user_id);
CREATE INDEX idx_manual_verifications_reviewer_user_id ON public.manual_verifications(reviewer_user_id);
CREATE INDEX idx_manual_verifications_status ON public.manual_verifications(status);
CREATE INDEX idx_manual_verifications_expires_at ON public.manual_verifications(expires_at);
CREATE INDEX idx_verification_audit_log_verification_id ON public.verification_audit_log(verification_id);
CREATE INDEX idx_verification_audit_log_user_id ON public.verification_audit_log(user_id);
CREATE INDEX idx_verification_audit_log_created_at ON public.verification_audit_log(created_at);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_manual_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_manual_verifications_updated_at
  BEFORE UPDATE ON public.manual_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_manual_verifications_updated_at();

-- Add encounter_id to vai_check_sessions for linking to encounters
ALTER TABLE public.vai_check_sessions 
  ADD COLUMN IF NOT EXISTS encounter_id UUID REFERENCES public.encounters(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_vai_check_sessions_encounter_id ON public.vai_check_sessions(encounter_id);

-- Add manual_verification_id to vai_check_sessions
ALTER TABLE public.vai_check_sessions 
  ADD COLUMN IF NOT EXISTS manual_verification_id UUID REFERENCES public.manual_verifications(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_vai_check_sessions_manual_verification_id ON public.vai_check_sessions(manual_verification_id);


