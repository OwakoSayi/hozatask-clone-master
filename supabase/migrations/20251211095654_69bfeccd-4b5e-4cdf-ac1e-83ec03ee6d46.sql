-- Drop the existing permissive policy
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;

-- Create a new policy that requires authentication
CREATE POLICY "Authenticated users can create bookings"
ON public.bookings
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);