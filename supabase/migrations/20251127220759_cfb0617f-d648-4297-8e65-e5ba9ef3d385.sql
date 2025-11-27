-- Create reviews table for ratings and reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews"
ON public.reviews
FOR SELECT
USING (true);

-- Only admins can create reviews (for now, can be updated later to allow customers)
CREATE POLICY "Admins can create reviews"
ON public.reviews
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Create index for better performance
CREATE INDEX idx_reviews_supplier_id ON public.reviews(supplier_id);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);

-- Add user_id to suppliers table to link suppliers with auth users
ALTER TABLE public.suppliers ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for user_id lookup
CREATE INDEX idx_suppliers_user_id ON public.suppliers(user_id);

-- Update RLS policies for service_options to allow approved suppliers to manage their own listings
CREATE POLICY "Approved suppliers can create their own service options"
ON public.service_options
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.suppliers
    WHERE suppliers.id = service_options.supplier_id
    AND suppliers.user_id = auth.uid()
    AND suppliers.status = 'Active'
  )
);

CREATE POLICY "Approved suppliers can update their own service options"
ON public.service_options
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.suppliers
    WHERE suppliers.id = service_options.supplier_id
    AND suppliers.user_id = auth.uid()
    AND suppliers.status = 'Active'
  )
);

CREATE POLICY "Approved suppliers can delete their own service options"
ON public.service_options
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.suppliers
    WHERE suppliers.id = service_options.supplier_id
    AND suppliers.user_id = auth.uid()
    AND suppliers.status = 'Active'
  )
);

-- Update suppliers RLS to allow suppliers to view and update their own profile
CREATE POLICY "Suppliers can view their own profile"
ON public.suppliers
FOR SELECT
USING (user_id = auth.uid() OR status = 'Active');

CREATE POLICY "Suppliers can update their own profile"
ON public.suppliers
FOR UPDATE
USING (user_id = auth.uid() AND status = 'Active');