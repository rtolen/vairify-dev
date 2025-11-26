-- Create blocked_users table
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, blocked_user_id)
);

-- Create user_reports table
CREATE TABLE IF NOT EXISTS public.user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  admin_notes TEXT
);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'marketplace',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, post_id, post_type)
);

-- Create privacy_settings table
CREATE TABLE IF NOT EXISTS public.privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  profile_visibility TEXT NOT NULL DEFAULT 'public',
  location_visibility TEXT NOT NULL DEFAULT 'city',
  online_status_visible BOOLEAN NOT NULL DEFAULT true,
  show_last_active BOOLEAN NOT NULL DEFAULT true,
  allow_screenshots BOOLEAN NOT NULL DEFAULT true,
  show_in_search BOOLEAN NOT NULL DEFAULT true,
  allow_messages_from TEXT NOT NULL DEFAULT 'everyone',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create business_services table
CREATE TABLE IF NOT EXISTS public.business_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blocked_users
CREATE POLICY "Users can manage their own blocks"
  ON public.blocked_users FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for user_reports
CREATE POLICY "Users can create reports"
  ON public.user_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
  ON public.user_reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
  ON public.user_reports FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for bookmarks
CREATE POLICY "Users can manage their own bookmarks"
  ON public.bookmarks FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for privacy_settings
CREATE POLICY "Users can manage their own privacy settings"
  ON public.privacy_settings FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for business_services
CREATE POLICY "Business owners can manage their services"
  ON public.business_services FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = business_services.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view active services"
  ON public.business_services FOR SELECT
  USING (is_active = true);

-- Create indexes
CREATE INDEX idx_blocked_users_user_id ON public.blocked_users(user_id);
CREATE INDEX idx_blocked_users_blocked_user_id ON public.blocked_users(blocked_user_id);
CREATE INDEX idx_user_reports_reporter_id ON public.user_reports(reporter_id);
CREATE INDEX idx_user_reports_reported_user_id ON public.user_reports(reported_user_id);
CREATE INDEX idx_user_reports_status ON public.user_reports(status);
CREATE INDEX idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX idx_bookmarks_post_id ON public.bookmarks(post_id);
CREATE INDEX idx_privacy_settings_user_id ON public.privacy_settings(user_id);
CREATE INDEX idx_business_services_business_id ON public.business_services(business_id);