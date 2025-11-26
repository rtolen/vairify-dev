-- Add bio and profile_links columns to profiles table for client customization
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS profile_links JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.bio IS 'User bio/description for their profile page';
COMMENT ON COLUMN public.profiles.profile_links IS 'Array of links for Linktree-style profile customization';
