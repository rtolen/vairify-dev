-- Function to auto-disable Available Now when encounter is accepted
CREATE OR REPLACE FUNCTION public.auto_disable_available_now_on_encounter()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When an encounter is accepted, disable available_now for the provider
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    UPDATE public.provider_profiles
    SET 
      available_now = false,
      available_now_started_at = NULL,
      available_now_location = NULL
    WHERE user_id = NEW.provider_id
    AND available_now = true;
    
    -- Send notification to provider
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.provider_id,
      'availability_auto_disabled',
      'Available Now Disabled',
      'Your Available Now status was automatically disabled because you accepted a VAI Check encounter.',
      jsonb_build_object(
        'encounter_id', NEW.id,
        'disabled_at', now(),
        'reason', 'encounter_accepted'
      )
    );
    
    RAISE LOG 'Auto-disabled Available Now for provider % due to encounter acceptance', NEW.provider_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-disabling Available Now
DROP TRIGGER IF EXISTS trigger_auto_disable_available_now ON public.encounters;
CREATE TRIGGER trigger_auto_disable_available_now
  AFTER INSERT OR UPDATE OF status ON public.encounters
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_disable_available_now_on_encounter();

-- Add comment for documentation
COMMENT ON FUNCTION public.auto_disable_available_now_on_encounter() IS 
'Automatically disables Available Now status for providers when they accept a VAI Check encounter. This prevents them from receiving multiple requests while engaged.';