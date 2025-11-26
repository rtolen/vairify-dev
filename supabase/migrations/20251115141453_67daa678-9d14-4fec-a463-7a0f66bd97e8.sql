-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  appointment_type TEXT,
  notes TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Create schedule templates for providers
CREATE TABLE public.schedule_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create time slots for templates
CREATE TABLE public.schedule_time_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.schedule_templates(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_slot_time CHECK (end_time > start_time)
);

-- Create calendar settings with scheduling rules
CREATE TABLE public.calendar_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  advance_notice_hours INTEGER NOT NULL DEFAULT 24,
  max_advance_days INTEGER NOT NULL DEFAULT 90,
  allow_same_day_booking BOOLEAN NOT NULL DEFAULT false,
  buffer_time_minutes INTEGER NOT NULL DEFAULT 0,
  min_appointment_duration_minutes INTEGER NOT NULL DEFAULT 60,
  max_appointment_duration_minutes INTEGER NOT NULL DEFAULT 480,
  auto_confirm_appointments BOOLEAN NOT NULL DEFAULT false,
  cancellation_notice_hours INTEGER NOT NULL DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for appointments
CREATE POLICY "Users can view their own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = provider_id OR auth.uid() = client_id);

CREATE POLICY "Clients can create appointment requests"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update their own appointments"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = provider_id OR auth.uid() = client_id);

CREATE POLICY "Users can delete their own appointments"
  ON public.appointments FOR DELETE
  USING (auth.uid() = provider_id OR auth.uid() = client_id);

-- RLS Policies for schedule templates
CREATE POLICY "Users can manage their own templates"
  ON public.schedule_templates FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active templates"
  ON public.schedule_templates FOR SELECT
  USING (is_active = true);

-- RLS Policies for time slots
CREATE POLICY "Users can manage slots for their templates"
  ON public.schedule_time_slots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.schedule_templates
      WHERE schedule_templates.id = schedule_time_slots.template_id
      AND schedule_templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view slots for active templates"
  ON public.schedule_time_slots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.schedule_templates
      WHERE schedule_templates.id = schedule_time_slots.template_id
      AND schedule_templates.is_active = true
    )
  );

-- RLS Policies for calendar settings
CREATE POLICY "Users can manage their own settings"
  ON public.calendar_settings FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view provider settings"
  ON public.calendar_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.provider_profiles
      WHERE provider_profiles.user_id = calendar_settings.user_id
    )
  );

-- Create function to check for appointment conflicts
CREATE OR REPLACE FUNCTION check_appointment_conflict(
  p_provider_id UUID,
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE,
  p_appointment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.appointments
    WHERE provider_id = p_provider_id
    AND status NOT IN ('cancelled', 'declined')
    AND (p_appointment_id IS NULL OR id != p_appointment_id)
    AND (
      (start_time <= p_start_time AND end_time > p_start_time)
      OR (start_time < p_end_time AND end_time >= p_end_time)
      OR (start_time >= p_start_time AND end_time <= p_end_time)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for updated_at
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedule_templates_updated_at
  BEFORE UPDATE ON public.schedule_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_settings_updated_at
  BEFORE UPDATE ON public.calendar_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();