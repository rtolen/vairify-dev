-- Add availability columns to provider_profiles (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'provider_profiles' AND column_name = 'available_now') THEN
    ALTER TABLE public.provider_profiles ADD COLUMN available_now boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'provider_profiles' AND column_name = 'available_now_started_at') THEN
    ALTER TABLE public.provider_profiles ADD COLUMN available_now_started_at timestamp with time zone;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'provider_profiles' AND column_name = 'available_now_location') THEN
    ALTER TABLE public.provider_profiles ADD COLUMN available_now_location jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'provider_profiles' AND column_name = 'accept_invitations') THEN
    ALTER TABLE public.provider_profiles ADD COLUMN accept_invitations boolean DEFAULT true;
  END IF;
END $$;

-- Create client_invitations table
CREATE TABLE IF NOT EXISTS public.client_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences jsonb DEFAULT '{}'::jsonb,
  location jsonb,
  status text NOT NULL DEFAULT 'active',
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create invitation_responses table
CREATE TABLE IF NOT EXISTS public.invitation_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid NOT NULL REFERENCES public.client_invitations(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'interested',
  responded_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(invitation_id, provider_id)
);

-- Enable RLS
ALTER TABLE public.client_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_invitations
DROP POLICY IF EXISTS "Clients can create their own invitations" ON public.client_invitations;
CREATE POLICY "Clients can create their own invitations"
  ON public.client_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Clients can view their own invitations" ON public.client_invitations;
CREATE POLICY "Clients can view their own invitations"
  ON public.client_invitations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Clients can update their own invitations" ON public.client_invitations;
CREATE POLICY "Clients can update their own invitations"
  ON public.client_invitations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Providers can view active invitations" ON public.client_invitations;
CREATE POLICY "Providers can view active invitations"
  ON public.client_invitations
  FOR SELECT
  TO authenticated
  USING (
    status = 'active' 
    AND expires_at > now()
    AND EXISTS (
      SELECT 1 FROM public.provider_profiles 
      WHERE user_id = auth.uid() 
      AND accept_invitations = true
    )
  );

-- RLS Policies for invitation_responses
DROP POLICY IF EXISTS "Providers can create responses to invitations" ON public.invitation_responses;
CREATE POLICY "Providers can create responses to invitations"
  ON public.invitation_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = provider_id 
    AND EXISTS (
      SELECT 1 FROM public.provider_profiles 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Providers can view their own responses" ON public.invitation_responses;
CREATE POLICY "Providers can view their own responses"
  ON public.invitation_responses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = provider_id);

DROP POLICY IF EXISTS "Clients can view responses to their invitations" ON public.invitation_responses;
CREATE POLICY "Clients can view responses to their invitations"
  ON public.invitation_responses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_invitations 
      WHERE id = invitation_responses.invitation_id 
      AND client_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Providers can update their own responses" ON public.invitation_responses;
CREATE POLICY "Providers can update their own responses"
  ON public.invitation_responses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = provider_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_provider_profiles_available_now ON public.provider_profiles(available_now) WHERE available_now = true;
CREATE INDEX IF NOT EXISTS idx_provider_profiles_accept_invitations ON public.provider_profiles(accept_invitations) WHERE accept_invitations = true;
CREATE INDEX IF NOT EXISTS idx_client_invitations_status ON public.client_invitations(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_client_invitations_client_id ON public.client_invitations(client_id);
CREATE INDEX IF NOT EXISTS idx_invitation_responses_invitation_id ON public.invitation_responses(invitation_id);
CREATE INDEX IF NOT EXISTS idx_invitation_responses_provider_id ON public.invitation_responses(provider_id);

-- Add trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_client_invitations_updated_at ON public.client_invitations;
CREATE TRIGGER update_client_invitations_updated_at
  BEFORE UPDATE ON public.client_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();