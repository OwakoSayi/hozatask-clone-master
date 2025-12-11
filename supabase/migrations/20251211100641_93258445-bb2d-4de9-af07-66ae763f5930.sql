-- Fix 1: Remove the policy that allows unauthenticated viewing via OR condition
DROP POLICY IF EXISTS "Suppliers can view their own profile" ON public.suppliers;

-- Create policy for suppliers to view only their own profile
CREATE POLICY "Suppliers can view their own profile"
ON public.suppliers
FOR SELECT
USING (user_id = auth.uid());

-- Fix 2: Restrict service_options to authenticated users only
DROP POLICY IF EXISTS "Anyone can view active service options" ON public.service_options;

CREATE POLICY "Authenticated users can view active service options"
ON public.service_options
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

-- Fix 3: Remove dangerous admin insert policy - only existing admins can create new admins
DROP POLICY IF EXISTS "Allow insert via function" ON public.admin_users;

CREATE POLICY "Only admins can create admin users"
ON public.admin_users
FOR INSERT
WITH CHECK (is_admin(auth.uid()));