-- Add Stripe columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT;

-- Create stripe_connect_accounts table for referral payouts
CREATE TABLE IF NOT EXISTS public.stripe_connect_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  stripe_account_id TEXT NOT NULL,
  onboarding_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on stripe_connect_accounts
ALTER TABLE public.stripe_connect_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stripe_connect_accounts
CREATE POLICY "Users can view their own connect account"
  ON public.stripe_connect_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own connect account"
  ON public.stripe_connect_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connect account"
  ON public.stripe_connect_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all connect accounts"
  ON public.stripe_connect_accounts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON public.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription ON public.profiles(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_stripe_connect_user ON public.stripe_connect_accounts(user_id);

-- Add updated_at trigger for stripe_connect_accounts
CREATE TRIGGER update_stripe_connect_accounts_updated_at
  BEFORE UPDATE ON public.stripe_connect_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();