-- Create country representative competitions table
CREATE TABLE public.country_representative_competitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  competition_start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  competition_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  winner_user_id UUID REFERENCES auth.users(id),
  winner_announced_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(country_code, competition_start_date)
);

-- Create referral leaderboard view (without country for now)
CREATE OR REPLACE VIEW public.referral_leaderboard AS
SELECT 
  r.referrer_id as user_id,
  p.full_name,
  p.avatar_url,
  COALESCE(rp.username, p.full_name) as display_name,
  COUNT(DISTINCT r.referred_user_id) as total_referrals,
  COUNT(DISTINCT CASE WHEN rp2.user_id IS NOT NULL THEN r.referred_user_id END) as provider_referrals,
  MAX(r.created_at) as last_referral_date
FROM public.referrals r
INNER JOIN public.profiles p ON r.referrer_id = p.id
LEFT JOIN public.provider_profiles rp ON r.referrer_id = rp.user_id
LEFT JOIN public.provider_profiles rp2 ON r.referred_user_id = rp2.user_id
GROUP BY r.referrer_id, p.full_name, p.avatar_url, rp.username
HAVING COUNT(DISTINCT r.referred_user_id) > 0
ORDER BY COUNT(DISTINCT r.referred_user_id) DESC;

-- Enable RLS
ALTER TABLE public.country_representative_competitions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for competitions
CREATE POLICY "Anyone can view active competitions"
  ON public.country_representative_competitions FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage competitions"
  ON public.country_representative_competitions FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_country_representative_competitions_updated_at
  BEFORE UPDATE ON public.country_representative_competitions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();