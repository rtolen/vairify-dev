-- Add delivery tracking fields to referral_invitations table
-- Feature: Referrals Email/SMS Sending

-- Add delivery tracking columns
ALTER TABLE public.referral_invitations
  ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed', 'bounced')),
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS delivery_error TEXT,
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS referrer_type VARCHAR(20) DEFAULT 'user' CHECK (referrer_type IN ('user', 'influencer')),
  ADD COLUMN IF NOT EXISTS custom_code VARCHAR(50);

-- Create index for delivery status queries
CREATE INDEX IF NOT EXISTS idx_referral_invitations_delivery_status 
  ON public.referral_invitations(delivery_status);

CREATE INDEX IF NOT EXISTS idx_referral_invitations_referrer_type 
  ON public.referral_invitations(referrer_type);

CREATE INDEX IF NOT EXISTS idx_referral_invitations_custom_code 
  ON public.referral_invitations(custom_code);

-- Create index for sent_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_referral_invitations_sent_at 
  ON public.referral_invitations(sent_at DESC);

-- Comments for documentation
COMMENT ON COLUMN public.referral_invitations.delivery_status IS 'Status of invitation delivery: pending, sent, failed, or bounced';
COMMENT ON COLUMN public.referral_invitations.sent_at IS 'Timestamp when invitation was sent';
COMMENT ON COLUMN public.referral_invitations.delivery_error IS 'Error message if delivery failed';
COMMENT ON COLUMN public.referral_invitations.opened_at IS 'Timestamp when email was opened (if tracking enabled)';
COMMENT ON COLUMN public.referral_invitations.clicked_at IS 'Timestamp when referral link was clicked (if tracking enabled)';
COMMENT ON COLUMN public.referral_invitations.referrer_type IS 'Type of referrer: user (standard) or influencer';
COMMENT ON COLUMN public.referral_invitations.custom_code IS 'Custom code for influencer referrals';


