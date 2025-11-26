-- DateGuard Complete Schema - Emergency Command Center
-- Adds all fields and tables needed for complete DateGuard system

-- Create dateguard_codes table for disarm and decoy codes
CREATE TABLE IF NOT EXISTS public.dateguard_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_vai VARCHAR(50),
  disarm_code_hash TEXT NOT NULL,
  decoy_code_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Update guardian_groups table if it doesn't have all fields
DO $$ 
BEGIN
  -- Add user_vai if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'guardian_groups' 
    AND column_name = 'user_vai'
  ) THEN
    ALTER TABLE public.guardian_groups ADD COLUMN user_vai VARCHAR(50);
  END IF;

  -- Add members JSONB if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'guardian_groups' 
    AND column_name = 'members'
  ) THEN
    ALTER TABLE public.guardian_groups ADD COLUMN members JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add new fields to dateguard_sessions
ALTER TABLE public.dateguard_sessions
  ADD COLUMN IF NOT EXISTS user_vai VARCHAR(50),
  ADD COLUMN IF NOT EXISTS scheduled_duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS buffer_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS selected_groups JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS location_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS location_notes TEXT,
  ADD COLUMN IF NOT EXISTS gps_coordinates JSONB,
  ADD COLUMN IF NOT EXISTS nearest_police JSONB,
  ADD COLUMN IF NOT EXISTS scheduled_end_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS buffer_end_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS ended_via TEXT CHECK (ended_via IN ('normal', 'panic', 'decoy', 'timer_expiration')),
  ADD COLUMN IF NOT EXISTS emergency_command_center_activated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS group_chat_id TEXT,
  ADD COLUMN IF NOT EXISTS gps_tracking_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_gps_update TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS pre_activation_photos JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS pre_activation_notes TEXT;

-- Create emergency_command_center_messages table
CREATE TABLE IF NOT EXISTS public.emergency_command_center_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.dateguard_sessions(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('system', 'guardian', 'gps_update', 'status_change', 'user_activity', 'initial')),
  content TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dateguard_codes_user_id ON public.dateguard_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_dateguard_codes_user_vai ON public.dateguard_codes(user_vai);
CREATE INDEX IF NOT EXISTS idx_dateguard_sessions_user_vai ON public.dateguard_sessions(user_vai);
CREATE INDEX IF NOT EXISTS idx_dateguard_sessions_status ON public.dateguard_sessions(status);
CREATE INDEX IF NOT EXISTS idx_ecc_messages_session_id ON public.emergency_command_center_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_ecc_messages_created_at ON public.emergency_command_center_messages(created_at);

-- Enable RLS
ALTER TABLE public.dateguard_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_command_center_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dateguard_codes
CREATE POLICY "Users can view their own codes"
  ON public.dateguard_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own codes"
  ON public.dateguard_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own codes"
  ON public.dateguard_codes FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for emergency_command_center_messages
CREATE POLICY "Users can view messages for their sessions"
  ON public.emergency_command_center_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.dateguard_sessions
      WHERE dateguard_sessions.id = emergency_command_center_messages.session_id
      AND dateguard_sessions.user_id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE public.dateguard_codes IS 'Stores hashed disarm and decoy codes for DateGuard users';
COMMENT ON TABLE public.emergency_command_center_messages IS 'Stores Emergency Command Center SMS messages and updates';
COMMENT ON COLUMN public.dateguard_sessions.user_vai IS 'User VAI number for DateGuard session';
COMMENT ON COLUMN public.dateguard_sessions.buffer_minutes IS 'Grace period before alerting guardians after timer expires';
COMMENT ON COLUMN public.dateguard_sessions.selected_groups IS 'Array of guardian group IDs selected for this session';
COMMENT ON COLUMN public.dateguard_sessions.gps_coordinates IS 'JSON object with lat and lng';
COMMENT ON COLUMN public.dateguard_sessions.nearest_police IS 'Police station data from Google Places API';
COMMENT ON COLUMN public.dateguard_sessions.ended_via IS 'How the session ended: normal, panic, decoy, or timer_expiration';
COMMENT ON COLUMN public.dateguard_sessions.emergency_command_center_activated IS 'Whether Emergency Command Center is active';
COMMENT ON COLUMN public.dateguard_sessions.group_chat_id IS 'Twilio group chat ID for SMS communication';


