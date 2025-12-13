-- Allow admins to delete admin users
CREATE POLICY "Admins can delete admin users" 
ON public.admin_users 
FOR DELETE 
USING (is_admin(auth.uid()));