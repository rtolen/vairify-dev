-- Create business types enum
CREATE TYPE public.business_type AS ENUM ('service', 'non_service');

-- Create businesses table
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  business_name TEXT NOT NULL,
  business_type public.business_type NOT NULL,
  description TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create business_vai_coupons table
CREATE TABLE public.business_vai_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  coupon_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'unused', -- unused, used, expired
  redeemed_by_user_id UUID,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create business_employees table
CREATE TABLE public.business_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  employee_user_id UUID NOT NULL,
  business_vai_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active', -- active, fired
  feature_permissions JSONB NOT NULL DEFAULT '{"chats": true, "vairipay": true, "dateguard": "employee_controlled"}',
  is_visible_in_directory BOOLEAN NOT NULL DEFAULT true,
  availability_status TEXT NOT NULL DEFAULT 'unavailable', -- available, unavailable
  hired_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fired_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_id, employee_user_id)
);

-- Create active_vai_context table (tracks which V.A.I. user is operating under)
CREATE TABLE public.active_vai_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  active_vai_type TEXT NOT NULL DEFAULT 'personal', -- personal, business
  active_business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  active_vai_number TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add business context to vai_verifications
ALTER TABLE public.vai_verifications 
ADD COLUMN business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
ADD COLUMN is_business_vai BOOLEAN NOT NULL DEFAULT false;

-- Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_vai_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_vai_context ENABLE ROW LEVEL SECURITY;

-- RLS Policies for businesses
CREATE POLICY "Business owners can view their businesses"
ON public.businesses FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Business owners can create businesses"
ON public.businesses FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Business owners can update their businesses"
ON public.businesses FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Admins can view all businesses"
ON public.businesses FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view service businesses"
ON public.businesses FOR SELECT
USING (business_type = 'service');

-- RLS Policies for business_vai_coupons
CREATE POLICY "Business owners can view their coupons"
ON public.business_vai_coupons FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.businesses 
  WHERE id = business_vai_coupons.business_id 
  AND owner_id = auth.uid()
));

CREATE POLICY "Business owners can manage their coupons"
ON public.business_vai_coupons FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.businesses 
  WHERE id = business_vai_coupons.business_id 
  AND owner_id = auth.uid()
));

CREATE POLICY "Admins can view all coupons"
ON public.business_vai_coupons FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for business_employees
CREATE POLICY "Business owners can view their employees"
ON public.business_employees FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.businesses 
  WHERE id = business_employees.business_id 
  AND owner_id = auth.uid()
));

CREATE POLICY "Business owners can manage their employees"
ON public.business_employees FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.businesses 
  WHERE id = business_employees.business_id 
  AND owner_id = auth.uid()
));

CREATE POLICY "Employees can view their own records"
ON public.business_employees FOR SELECT
USING (auth.uid() = employee_user_id);

CREATE POLICY "Employees can update their availability"
ON public.business_employees FOR UPDATE
USING (auth.uid() = employee_user_id);

CREATE POLICY "Public can view active directory listings"
ON public.business_employees FOR SELECT
USING (status = 'active' AND is_visible_in_directory = true);

CREATE POLICY "Admins can view all employees"
ON public.business_employees FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for active_vai_context
CREATE POLICY "Users can view their own context"
ON public.active_vai_context FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own context"
ON public.active_vai_context FOR ALL
USING (auth.uid() = user_id);

-- Function to generate business V.A.I. coupon code
CREATE OR REPLACE FUNCTION generate_vai_coupon_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := 'VAI-';
  i INTEGER;
BEGIN
  FOR i IN 1..10 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Function to generate business-specific V.A.I. number
CREATE OR REPLACE FUNCTION generate_business_vai_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := 'BIZ-';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Trigger to create 3 V.A.I. coupons when business is created
CREATE OR REPLACE FUNCTION create_initial_vai_coupons()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create 3 initial V.A.I. coupons
  INSERT INTO public.business_vai_coupons (business_id, coupon_code)
  VALUES 
    (NEW.id, generate_vai_coupon_code()),
    (NEW.id, generate_vai_coupon_code()),
    (NEW.id, generate_vai_coupon_code());
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_business_created
  AFTER INSERT ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION create_initial_vai_coupons();

-- Trigger to update updated_at
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_vai_coupons_updated_at
  BEFORE UPDATE ON public.business_vai_coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_employees_updated_at
  BEFORE UPDATE ON public.business_employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_active_vai_context_updated_at
  BEFORE UPDATE ON public.active_vai_context
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();