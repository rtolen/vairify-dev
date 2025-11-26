-- Fix Critical Security Issue: Restrict access to email_verifications table
-- This prevents public access to email addresses and OTP codes

-- Drop the existing insecure policy
DROP POLICY IF EXISTS "Users can view their own email verification" ON public.email_verifications;

-- Create secure policies that restrict access by email
CREATE POLICY "Users can view their own email verification by email"
ON public.email_verifications
FOR SELECT
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Allow unauthenticated users to view only their own verification during signup
-- This is needed for the OTP verification flow before the user is fully authenticated
CREATE POLICY "Unauthenticated users can view their own verification"
ON public.email_verifications
FOR SELECT
TO anon
USING (
  -- Only allow viewing records for a specific email that the user provides
  -- The verification will be done server-side through edge functions
  false -- We'll handle this through edge functions only
);

-- Ensure service role can still manage everything
-- (This policy already exists and is correct)

-- Add policy to allow edge functions to insert verification records
CREATE POLICY "Service role can insert email verifications"
ON public.email_verifications
FOR INSERT
TO service_role
WITH CHECK (true);

-- Add policy to allow edge functions to update verification records
CREATE POLICY "Service role can update email verifications"
ON public.email_verifications
FOR UPDATE
TO service_role
USING (true);