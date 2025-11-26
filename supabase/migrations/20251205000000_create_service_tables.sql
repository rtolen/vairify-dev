-- Create service_categories table for organizing services
CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Icon identifier or emoji
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  parent_category_id UUID REFERENCES public.service_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create service_options table for individual services
CREATE TABLE IF NOT EXISTS public.service_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional flexible data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create pricing table for provider service pricing (Included/Extra)
-- Note: Uses user_id instead of provider_profile_id to match provider_profiles structure
CREATE TABLE IF NOT EXISTS public.provider_service_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_option_id UUID NOT NULL REFERENCES public.service_options(id) ON DELETE CASCADE,
  price_type TEXT NOT NULL DEFAULT 'included', -- 'included' or 'extra'
  custom_price NUMERIC(10,2), -- Optional custom price override
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, service_option_id)
);

-- Enable RLS
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_service_pricing ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Anyone can view active categories and options
CREATE POLICY "Anyone can view active service categories"
  ON public.service_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view active service options"
  ON public.service_options FOR SELECT
  USING (is_active = true);

-- RLS Policies: Providers can manage their own pricing
CREATE POLICY "Providers can manage their own service pricing"
  ON public.provider_service_pricing FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Providers can view their own service pricing"
  ON public.provider_service_pricing FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active service pricing"
  ON public.provider_service_pricing FOR SELECT
  USING (is_active = true);

-- Create indexes
CREATE INDEX idx_service_categories_parent_id ON public.service_categories(parent_category_id);
CREATE INDEX idx_service_categories_display_order ON public.service_categories(display_order);
CREATE INDEX idx_service_options_category_id ON public.service_options(category_id);
CREATE INDEX idx_service_options_display_order ON public.service_options(display_order);
CREATE INDEX idx_provider_service_pricing_user_id ON public.provider_service_pricing(user_id);
CREATE INDEX idx_provider_service_pricing_service_id ON public.provider_service_pricing(service_option_id);

-- Insert sample data for service categories
INSERT INTO public.service_categories (name, display_name, description, icon, display_order) VALUES
  ('companionship', 'Companionship', 'General companionship services', '💬', 1),
  ('social', 'Social Events', 'Attending social events and gatherings', '🎉', 2),
  ('travel', 'Travel Companion', 'Travel and tour services', '✈️', 3),
  ('dining', 'Dining Services', 'Restaurant and meal services', '🍽️', 4),
  ('entertainment', 'Entertainment', 'Entertainment and activities', '🎭', 5)
ON CONFLICT (name) DO NOTHING;

-- Insert sample service options
INSERT INTO public.service_options (category_id, name, display_name, description, base_price, duration_minutes, display_order)
SELECT 
  c.id,
  'hourly_companionship',
  'Hourly Companionship',
  'General companionship per hour',
  200.00,
  60,
  1
FROM public.service_categories c WHERE c.name = 'companionship'
ON CONFLICT DO NOTHING;

INSERT INTO public.service_options (category_id, name, display_name, description, base_price, duration_minutes, display_order)
SELECT 
  c.id,
  'social_event',
  'Social Event',
  'Attend social event or gathering',
  350.00,
  120,
  1
FROM public.service_categories c WHERE c.name = 'social'
ON CONFLICT DO NOTHING;

INSERT INTO public.service_options (category_id, name, display_name, description, base_price, duration_minutes, display_order)
SELECT 
  c.id,
  'city_tour',
  'City Tour',
  'Guided city tour',
  280.00,
  90,
  1
FROM public.service_categories c WHERE c.name = 'travel'
ON CONFLICT DO NOTHING;

INSERT INTO public.service_options (category_id, name, display_name, description, base_price, duration_minutes, display_order)
SELECT 
  c.id,
  'dinner_companion',
  'Dinner Companion',
  'Dining service (client covers meal)',
  250.00,
  120,
  1
FROM public.service_categories c WHERE c.name = 'dining'
ON CONFLICT DO NOTHING;

