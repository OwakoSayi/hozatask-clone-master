
-- Drop the problematic foreign key constraint on suppliers
ALTER TABLE public.suppliers DROP CONSTRAINT IF EXISTS suppliers_user_id_fkey;

-- The user_id column should NOT have a foreign key to auth.users
-- because we can't directly reference auth schema from public schema in a way that works reliably
-- Instead, we'll keep it as a UUID without a constraint (the RLS policies will handle security)
