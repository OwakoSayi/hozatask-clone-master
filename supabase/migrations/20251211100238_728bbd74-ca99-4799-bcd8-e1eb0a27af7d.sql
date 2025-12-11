-- Drop the existing public view policy for suppliers
DROP POLICY IF EXISTS "Anyone can view active suppliers" ON public.suppliers;

-- Create a new policy that requires authentication to view supplier details
CREATE POLICY "Authenticated users can view active suppliers"
ON public.suppliers
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND status = 'Active'::supplier_status
);