-- Create provider availability schedules table
CREATE TABLE IF NOT EXISTS public.provider_availability_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Prevent overlapping schedules for the same day
  CONSTRAINT no_overlapping_schedules UNIQUE (user_id, day_of_week, start_time)
);

-- Enable RLS
ALTER TABLE public.provider_availability_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own schedules"
  ON public.provider_availability_schedules
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own schedules"
  ON public.provider_availability_schedules
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedules"
  ON public.provider_availability_schedules
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedules"
  ON public.provider_availability_schedules
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_schedules_user_day ON public.provider_availability_schedules(user_id, day_of_week);
CREATE INDEX idx_schedules_enabled ON public.provider_availability_schedules(is_enabled) WHERE is_enabled = true;

-- Create trigger for updated_at
CREATE TRIGGER update_provider_availability_schedules_updated_at
  BEFORE UPDATE ON public.provider_availability_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add schedule_enabled field to provider_profiles
ALTER TABLE public.provider_profiles
  ADD COLUMN IF NOT EXISTS auto_availability_enabled BOOLEAN DEFAULT false;

COMMENT ON TABLE public.provider_availability_schedules IS 'Stores recurring weekly availability schedules for providers';
COMMENT ON COLUMN public.provider_availability_schedules.day_of_week IS '0 = Sunday, 1 = Monday, ..., 6 = Saturday';
COMMENT ON COLUMN public.provider_availability_schedules.timezone IS 'IANA timezone identifier for the schedule';
COMMENT ON COLUMN public.provider_profiles.auto_availability_enabled IS 'Whether automatic availability based on schedules is enabled';