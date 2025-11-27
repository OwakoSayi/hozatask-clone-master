-- Create a secure function to add admin users
CREATE OR REPLACE FUNCTION public.create_admin_user(user_email TEXT, user_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into admin_users table
  INSERT INTO public.admin_users (email, user_id)
  VALUES (user_email, user_user_id)
  ON CONFLICT (email) DO NOTHING;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_admin_user TO authenticated;

-- Add RLS policy to allow inserting via the function
CREATE POLICY "Allow insert via function" ON public.admin_users
  FOR INSERT
  WITH CHECK (true);