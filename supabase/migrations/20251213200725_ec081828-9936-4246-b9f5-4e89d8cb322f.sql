-- Add new fields to suppliers table for Thumbtack-style pro signup
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS years_in_business integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS employee_count text DEFAULT 'just_me',
ADD COLUMN IF NOT EXISTS service_radius_km integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS travel_preference text DEFAULT 'to_customer',
ADD COLUMN IF NOT EXISTS show_prices boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS licenses text[] DEFAULT NULL;

-- Add new fields to pro_accounts for lead preferences
ALTER TABLE public.pro_accounts
ADD COLUMN IF NOT EXISTS lead_mode text DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS monthly_budget_cap integer DEFAULT NULL;

-- Add new fields to project_requests for customer journey
ALTER TABLE public.project_requests
ADD COLUMN IF NOT EXISTS property_type text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS scope_size text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS date_flexibility text DEFAULT 'specific',
ADD COLUMN IF NOT EXISTS images text[] DEFAULT NULL;