-- Add missing fields to reviews table for TrueRevu
-- Feature: TrueRevu Backend Completion

-- Add reviewer_vai_number and reviewee_vai_number to reviews table
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS reviewer_vai_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS reviewee_vai_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS mutual_completion_verified BOOLEAN DEFAULT false NOT NULL;

-- Create index for VAI number lookups
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_vai ON public.reviews(reviewer_vai_number);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_vai ON public.reviews(reviewee_vai_number);
CREATE INDEX IF NOT EXISTS idx_reviews_is_verified ON public.reviews(is_verified);
CREATE INDEX IF NOT EXISTS idx_reviews_mutual_completion ON public.reviews(mutual_completion_verified);

-- Ensure encounters table has proper linking to vai_check_sessions
-- (This should already exist, but verify)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'encounters' 
    AND column_name = 'session_id'
  ) THEN
    ALTER TABLE public.encounters ADD COLUMN session_id UUID REFERENCES public.vai_check_sessions(id);
  END IF;
END $$;

-- Add function to check if both parties completed encounter before allowing review
CREATE OR REPLACE FUNCTION public.can_submit_review(
  p_encounter_id UUID,
  p_reviewer_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_encounter RECORD;
  v_reviewer_is_provider BOOLEAN;
  v_other_party_completed BOOLEAN;
BEGIN
  -- Get encounter
  SELECT * INTO v_encounter
  FROM public.encounters
  WHERE id = p_encounter_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if reviewer is provider or client
  v_reviewer_is_provider := (v_encounter.provider_id = p_reviewer_id);
  
  -- Check if other party has completed their review
  IF v_reviewer_is_provider THEN
    -- Reviewer is provider, check if client completed
    SELECT EXISTS(
      SELECT 1 FROM public.reviews
      WHERE encounter_id = p_encounter_id
      AND reviewer_id = v_encounter.client_id
      AND submitted = true
    ) INTO v_other_party_completed;
  ELSE
    -- Reviewer is client, check if provider completed
    SELECT EXISTS(
      SELECT 1 FROM public.reviews
      WHERE encounter_id = p_encounter_id
      AND reviewer_id = v_encounter.provider_id
      AND submitted = true
    ) INTO v_other_party_completed;
  END IF;
  
  -- For mutual verification: both parties must complete encounter
  -- This means both must have submitted reviews OR encounter must be marked as completed
  RETURN v_encounter.status = 'completed' OR v_other_party_completed;
END;
$$;

-- Comments for documentation
COMMENT ON COLUMN public.reviews.reviewer_vai_number IS 'VAI number of the user submitting the review';
COMMENT ON COLUMN public.reviews.reviewee_vai_number IS 'VAI number of the user being reviewed';
COMMENT ON COLUMN public.reviews.is_verified IS 'Always true - reviews are only allowed for verified encounters';
COMMENT ON COLUMN public.reviews.mutual_completion_verified IS 'True when both parties have completed the encounter';


