-- Create influencer portal tables
-- Feature: Influencer/Affiliate Portal

-- Create influencers table
CREATE TABLE IF NOT EXISTS public.influencers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  commission_rate DECIMAL(5,3) DEFAULT 0.10 CHECK (commission_rate >= 0.05 AND commission_rate <= 0.25),
  access_code VARCHAR(50) UNIQUE,
  application_text TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  audience_size VARCHAR(50),
  niche VARCHAR(100),
  payment_info JSONB DEFAULT '{}'::jsonb,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  pending_payout DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id)
);

-- Create influencer_applications table (for public applications)
CREATE TABLE IF NOT EXISTS public.influencer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  username VARCHAR(50) NOT NULL,
  social_links JSONB DEFAULT '{}'::jsonb,
  audience_size VARCHAR(50),
  niche VARCHAR(100),
  why_partner TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create influencer_custom_codes table
CREATE TABLE IF NOT EXISTS public.influencer_custom_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
  custom_code VARCHAR(30) UNIQUE NOT NULL,
  full_code VARCHAR(50) UNIQUE NOT NULL,
  qr_code_url TEXT,
  total_signups INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Create influencer_payouts table
CREATE TABLE IF NOT EXISTS public.influencer_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 50),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id)
);

-- Create access_codes table (for admin-generated codes)
CREATE TABLE IF NOT EXISTS public.influencer_access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  influencer_name VARCHAR(255),
  created_by UUID REFERENCES auth.users(id),
  used_by UUID REFERENCES public.influencers(id),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_custom_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_access_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for influencers
CREATE POLICY "Influencers can view their own data"
  ON public.influencers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Influencers can update their own data"
  ON public.influencers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all influencers"
  ON public.influencers FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can manage all influencers"
  ON public.influencers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- RLS Policies for influencer_applications
CREATE POLICY "Anyone can create applications"
  ON public.influencer_applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all applications"
  ON public.influencer_applications FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update applications"
  ON public.influencer_applications FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- RLS Policies for influencer_custom_codes
CREATE POLICY "Influencers can view their own codes"
  ON public.influencer_custom_codes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.influencers
      WHERE influencers.id = influencer_custom_codes.influencer_id
      AND influencers.user_id = auth.uid()
    )
  );

CREATE POLICY "Influencers can create their own codes"
  ON public.influencer_custom_codes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.influencers
      WHERE influencers.id = influencer_custom_codes.influencer_id
      AND influencers.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all codes"
  ON public.influencer_custom_codes FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- RLS Policies for influencer_payouts
CREATE POLICY "Influencers can view their own payouts"
  ON public.influencer_payouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.influencers
      WHERE influencers.id = influencer_payouts.influencer_id
      AND influencers.user_id = auth.uid()
    )
  );

CREATE POLICY "Influencers can create payout requests"
  ON public.influencer_payouts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.influencers
      WHERE influencers.id = influencer_payouts.influencer_id
      AND influencers.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all payouts"
  ON public.influencer_payouts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update payouts"
  ON public.influencer_payouts FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- RLS Policies for influencer_access_codes
CREATE POLICY "Admins can manage access codes"
  ON public.influencer_access_codes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Anyone can view active access codes for validation"
  ON public.influencer_access_codes FOR SELECT
  USING (is_active = true);

-- Create indexes
CREATE INDEX idx_influencers_user_id ON public.influencers(user_id);
CREATE INDEX idx_influencers_status ON public.influencers(status);
CREATE INDEX idx_influencers_access_code ON public.influencers(access_code);
CREATE INDEX idx_influencer_custom_codes_influencer_id ON public.influencer_custom_codes(influencer_id);
CREATE INDEX idx_influencer_custom_codes_custom_code ON public.influencer_custom_codes(custom_code);
CREATE INDEX idx_influencer_payouts_influencer_id ON public.influencer_payouts(influencer_id);
CREATE INDEX idx_influencer_payouts_status ON public.influencer_payouts(status);
CREATE INDEX idx_influencer_access_codes_code ON public.influencer_access_codes(code);
CREATE INDEX idx_influencer_access_codes_active ON public.influencer_access_codes(is_active);

-- Comments
COMMENT ON TABLE public.influencers IS 'Influencer accounts with commission tracking';
COMMENT ON TABLE public.influencer_applications IS 'Public applications to become an influencer';
COMMENT ON TABLE public.influencer_custom_codes IS 'Custom referral codes created by influencers';
COMMENT ON TABLE public.influencer_payouts IS 'Payout requests and history for influencers';
COMMENT ON TABLE public.influencer_access_codes IS 'Admin-generated access codes for recruited advocates';


