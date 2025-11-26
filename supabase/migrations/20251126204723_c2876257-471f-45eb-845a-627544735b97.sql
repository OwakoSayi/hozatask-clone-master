-- Drop all old tables and types
DROP TABLE IF EXISTS webhook_logs CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS booking_recurrence CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS task_messages CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS tasker_skills CASCADE;
DROP TABLE IF EXISTS tasker_kyc CASCADE;
DROP TABLE IF EXISTS taskers CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS admin_actions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;
DROP TYPE IF EXISTS offer_status CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS transaction_status CASCADE;
DROP TYPE IF EXISTS background_check_status CASCADE;
DROP TYPE IF EXISTS verification_status CASCADE;
DROP TYPE IF EXISTS document_type CASCADE;
DROP TYPE IF EXISTS pricing_type CASCADE;
DROP TYPE IF EXISTS recurrence_frequency CASCADE;
DROP TYPE IF EXISTS app_role CASCADE;

-- Create new simplified enums
CREATE TYPE booking_status AS ENUM ('New', 'InProgress', 'Matched', 'Completed', 'Cancelled');
CREATE TYPE supplier_status AS ENUM ('Pending', 'Active', 'Inactive');

-- Suppliers table (vendors who submit their services)
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  min_price NUMERIC,
  max_price NUMERIC,
  location TEXT,
  images TEXT[],
  status supplier_status DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Service options (what customers see and select)
CREATE TABLE service_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  images TEXT[],
  price_min NUMERIC,
  price_max NUMERIC,
  location_area TEXT,
  supplier_id UUID REFERENCES suppliers(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bookings (customer requests)
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  event_type TEXT,
  notes TEXT,
  selected_option_ids UUID[],
  booking_fee_paid BOOLEAN DEFAULT false,
  payment_intent_id TEXT,
  status booking_status DEFAULT 'New',
  matched_supplier_id UUID REFERENCES suppliers(id),
  matched_supplier_name TEXT,
  matched_supplier_contact TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Admin users table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Public policies (no auth required)
CREATE POLICY "Anyone can view active service options"
ON service_options FOR SELECT
USING (is_active = true);

CREATE POLICY "Anyone can create bookings"
ON bookings FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view active suppliers"
ON suppliers FOR SELECT
USING (status = 'Active');

CREATE POLICY "Anyone can submit supplier"
ON suppliers FOR INSERT
WITH CHECK (true);

-- Admin helper function
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE admin_users.user_id = is_admin.user_id
  )
$$;

-- Admin policies
CREATE POLICY "Admins can view all bookings"
ON bookings FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update bookings"
ON bookings FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view all suppliers"
ON suppliers FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update suppliers"
ON suppliers FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete suppliers"
ON suppliers FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage service options"
ON service_options FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view admin users"
ON admin_users FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));