-- Add INSERT policy for profiles table to allow trigger to create profiles
CREATE POLICY "Allow service role to insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);