-- Create transactions table for business revenue tracking
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  transaction_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Business owners can view their transactions"
ON public.transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = transactions.business_id
    AND businesses.owner_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all transactions"
ON public.transactions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Business owners can insert transactions"
ON public.transactions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = transactions.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_transactions_business_id ON public.transactions(business_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);