-- Add fields to track pre-registration tier deadlines
ALTER TABLE referral_codes 
ADD COLUMN IF NOT EXISTS registered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS vai_completion_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS vai_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tier_benefits_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS early_access_date DATE;

-- Function to set VAI deadline and early access date based on tier
CREATE OR REPLACE FUNCTION set_tier_benefits()
RETURNS TRIGGER AS $$
BEGIN
  -- Set 24-hour VAI completion deadline
  NEW.vai_completion_deadline := NEW.registered_at + INTERVAL '24 hours';
  
  -- Set early access date based on tier
  NEW.early_access_date := CASE NEW.tier
    WHEN 'founding_council' THEN '2025-12-10'::DATE
    WHEN 'first_movers' THEN '2025-12-15'::DATE
    WHEN 'early_access' THEN '2025-12-20'::DATE
    ELSE '2025-12-05'::DATE  -- Public launch date
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-set deadlines
DROP TRIGGER IF EXISTS set_tier_benefits_trigger ON referral_codes;
CREATE TRIGGER set_tier_benefits_trigger
BEFORE INSERT OR UPDATE OF tier ON referral_codes
FOR EACH ROW
EXECUTE FUNCTION set_tier_benefits();

-- Create index for deadline checks
CREATE INDEX IF NOT EXISTS idx_referral_codes_deadline ON referral_codes(vai_completion_deadline) 
WHERE tier_benefits_active = true AND vai_completed_at IS NULL;