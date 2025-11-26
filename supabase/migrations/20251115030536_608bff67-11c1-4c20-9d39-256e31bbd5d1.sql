-- Create table to log all emergency/legal access to transaction numbers
CREATE TABLE IF NOT EXISTS public.vai_identity_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vai_number TEXT NOT NULL,
  transaction_number TEXT NOT NULL,
  access_reason TEXT NOT NULL, -- 'emergency' or 'legal_subpoena'
  accessed_by_user_id UUID NOT NULL,
  accessed_by_name TEXT,
  requesting_entity TEXT, -- e.g., 'Law Enforcement', 'Court Order #12345', 'Emergency Services'
  authorization_reference TEXT, -- Case number, court order number, etc.
  access_notes TEXT,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vai_identity_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view access logs
CREATE POLICY "Admins can view all access logs"
ON public.vai_identity_access_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Only admins can insert access logs (done via edge function with service role)
CREATE POLICY "Admins can insert access logs"
ON public.vai_identity_access_logs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Create index for faster lookups
CREATE INDEX idx_vai_identity_access_logs_vai_number ON public.vai_identity_access_logs(vai_number);
CREATE INDEX idx_vai_identity_access_logs_accessed_at ON public.vai_identity_access_logs(accessed_at DESC);