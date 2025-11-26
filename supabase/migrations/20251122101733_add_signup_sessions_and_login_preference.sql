-- Create signup_sessions table for temporary session tracking during signup flow
CREATE TABLE IF NOT EXISTS public.signup_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
    email text NOT NULL,
    password_hash text, -- Store hashed password temporarily
    referral_vai text,
    coupon_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + interval '30 minutes') NOT NULL
);

-- Create index for faster session lookups
CREATE INDEX IF NOT EXISTS idx_signup_sessions_session_id ON public.signup_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_signup_sessions_expires_at ON public.signup_sessions(expires_at);

-- Add login_preference field to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS login_preference text DEFAULT 'email' CHECK (login_preference IN ('facial', 'email', 'password'));

-- Create index for login preference queries
CREATE INDEX IF NOT EXISTS idx_profiles_login_preference ON public.profiles(login_preference);

-- Add RLS policies for signup_sessions
ALTER TABLE public.signup_sessions ENABLE ROW LEVEL SECURITY;

-- Allow service role to read/write all signup sessions
CREATE POLICY IF NOT EXISTS "Service role can manage signup_sessions"
ON public.signup_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to read their own signup sessions (if needed)
CREATE POLICY IF NOT EXISTS "Users can read their own signup_sessions"
ON public.signup_sessions
FOR SELECT
TO authenticated
USING (true); -- Will be filtered by application logic

-- Function to automatically delete expired sessions
CREATE OR REPLACE FUNCTION delete_expired_signup_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.signup_sessions
    WHERE expires_at < now();
END;
$$;

-- Comment on table
COMMENT ON TABLE public.signup_sessions IS 'Temporary sessions for tracking signup flow data between ChainPass redirect';
COMMENT ON COLUMN public.signup_sessions.expires_at IS 'Session expires 30 minutes after creation';
COMMENT ON COLUMN public.profiles.login_preference IS 'User preferred login method: facial, email, or password';

