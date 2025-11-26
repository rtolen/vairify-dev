-- Recreate the view without SECURITY DEFINER (use SECURITY INVOKER)
DROP VIEW IF EXISTS public.referral_leaderboard;

CREATE VIEW public.referral_leaderboard 
WITH (security_invoker = true) AS
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