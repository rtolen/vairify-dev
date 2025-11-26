-- Create table for directory boosts (providers can boost their directory listing)
CREATE TABLE IF NOT EXISTS public.directory_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  boost_type TEXT NOT NULL CHECK (boost_type IN ('standard', 'premium', 'spotlight')),
  boost_bid_amount INTEGER NOT NULL DEFAULT 0,
  boost_position INTEGER,
  boost_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for admin-configurable Golden Roses bundles
CREATE TABLE IF NOT EXISTS public.golden_roses_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_name TEXT NOT NULL,
  price_usd NUMERIC NOT NULL,
  roses_amount INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.directory_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golden_roses_bundles ENABLE ROW LEVEL SECURITY;

-- RLS policies for directory_boosts
CREATE POLICY "Users can view their own boosts"
  ON public.directory_boosts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own boosts"
  ON public.directory_boosts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own boosts"
  ON public.directory_boosts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all boosts"
  ON public.directory_boosts
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- RLS policies for golden_roses_bundles
CREATE POLICY "Anyone can view active bundles"
  ON public.golden_roses_bundles
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage bundles"
  ON public.golden_roses_bundles
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Insert default bundles
INSERT INTO public.golden_roses_bundles (bundle_name, price_usd, roses_amount, display_order) VALUES
  ('Starter Pack', 10, 150, 1),
  ('Value Pack', 30, 500, 2)
ON CONFLICT DO NOTHING;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_directory_boosts_user_id ON public.directory_boosts(user_id);
CREATE INDEX IF NOT EXISTS idx_directory_boosts_expires_at ON public.directory_boosts(boost_expires_at);
CREATE INDEX IF NOT EXISTS idx_golden_roses_bundles_active ON public.golden_roses_bundles(is_active, display_order);