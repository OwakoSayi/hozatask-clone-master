-- Fix RLS policies for booking_recurrence
CREATE POLICY "Users can view own booking recurrence" ON public.booking_recurrence FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.booking_id = booking_recurrence.booking_id
    AND (
      auth.uid() IN (SELECT userid FROM public.clients WHERE client_id = b.client_id) OR
      auth.uid() IN (SELECT userid FROM public.taskers WHERE tasker_id = b.tasker_id)
    )
  )
);

-- Fix RLS policies for webhook_logs (admin only)
CREATE POLICY "Admins can view webhook logs" ON public.webhook_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE userid = auth.uid() AND role = 'Admin')
);

-- Fix calculate_distance function search_path
DROP FUNCTION IF EXISTS public.calculate_distance;
CREATE OR REPLACE FUNCTION public.calculate_distance(lat1 NUMERIC, lon1 NUMERIC, lat2 NUMERIC, lon2 NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  r NUMERIC := 6371; -- Earth's radius in km
  dLat NUMERIC;
  dLon NUMERIC;
  a NUMERIC;
  c NUMERIC;
BEGIN
  dLat := radians(lat2 - lat1);
  dLon := radians(lon2 - lon1);
  a := sin(dLat/2) * sin(dLat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dLon/2) * sin(dLon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN r * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = public;