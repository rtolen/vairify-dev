-- Fix RLS policy for signup_sessions to allow anonymous users to insert
-- This is needed because users create signup sessions BEFORE they are authenticated

-- Allow anonymous users to insert signup sessions (needed during registration)
CREATE POLICY IF NOT EXISTS "Anonymous users can create signup_sessions"
ON public.signup_sessions
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anonymous users to read signup sessions by session_id (needed during OTP verification)
-- This allows them to retrieve their own session data using the session_id
CREATE POLICY IF NOT EXISTS "Anonymous users can read signup_sessions by session_id"
ON public.signup_sessions
FOR SELECT
TO anon
USING (true); -- Application logic will filter by session_id

-- Allow anonymous users to update signup sessions (needed to add password_hash after VAI check)
CREATE POLICY IF NOT EXISTS "Anonymous users can update signup_sessions"
ON public.signup_sessions
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

