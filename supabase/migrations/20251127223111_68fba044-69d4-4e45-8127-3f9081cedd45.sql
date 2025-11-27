-- Add user_id to bookings table to link bookings to customers
ALTER TABLE public.bookings ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Add customer_id to reviews table to track who left the review
ALTER TABLE public.reviews ADD COLUMN customer_id uuid REFERENCES auth.users(id);

-- Update RLS policies for bookings
CREATE POLICY "Users can view their own bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Suppliers can view bookings matched to them
CREATE POLICY "Suppliers can view matched bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM suppliers 
    WHERE suppliers.id = bookings.matched_supplier_id 
    AND suppliers.user_id = auth.uid()
  )
);

-- Update reviews RLS policies
CREATE POLICY "Users can create reviews for their own bookings"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = customer_id AND
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = reviews.booking_id 
    AND bookings.user_id = auth.uid()
    AND bookings.status = 'Completed'
  )
);

CREATE POLICY "Users can view reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (true);