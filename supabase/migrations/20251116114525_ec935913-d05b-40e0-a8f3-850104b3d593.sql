-- Drop existing tables
DROP TABLE IF EXISTS public.verifications CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- Drop existing enums if they exist
DROP TYPE IF EXISTS public.app_role CASCADE;
DROP TYPE IF EXISTS public.booking_status CASCADE;

-- Create enums
CREATE TYPE public.user_role AS ENUM ('User', 'Admin');
CREATE TYPE public.pricing_type AS ENUM ('Fixed', 'Flexible');
CREATE TYPE public.task_status AS ENUM ('Open', 'Assigned', 'InProgress', 'Completed', 'Cancelled');
CREATE TYPE public.offer_status AS ENUM ('Pending', 'Accepted', 'Rejected');
CREATE TYPE public.booking_status AS ENUM ('Scheduled', 'InProgress', 'Completed', 'Cancelled');
CREATE TYPE public.transaction_status AS ENUM ('Authorized', 'Captured', 'Refunded', 'Failed', 'Voided');
CREATE TYPE public.document_type AS ENUM ('ID', 'Passport');
CREATE TYPE public.verification_status AS ENUM ('NotSubmitted', 'Pending', 'Cleared', 'Rejected');
CREATE TYPE public.background_check_status AS ENUM ('Pending', 'Cleared', 'Rejected');
CREATE TYPE public.recurrence_frequency AS ENUM ('Weekly', 'Biweekly', 'Monthly');

-- Users table
CREATE TABLE public.users (
  userid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  surname TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone_number TEXT,
  role user_role DEFAULT 'User',
  registration_date TIMESTAMPTZ DEFAULT NOW()
);

-- Clients table
CREATE TABLE public.clients (
  client_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userid UUID UNIQUE NOT NULL REFERENCES public.users(userid) ON DELETE CASCADE
);

-- Taskers table
CREATE TABLE public.taskers (
  tasker_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userid UUID UNIQUE NOT NULL REFERENCES public.users(userid) ON DELETE CASCADE,
  bio TEXT,
  hourly_rate NUMERIC,
  background_check_status background_check_status DEFAULT 'Pending',
  is_active BOOLEAN DEFAULT FALSE,
  service_radius_km NUMERIC DEFAULT 20
);

-- Addresses table
CREATE TABLE public.addresses (
  address_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(userid) ON DELETE CASCADE,
  street_address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'South Africa',
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  is_default BOOLEAN DEFAULT FALSE
);

-- Categories table
CREATE TABLE public.categories (
  category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  pricing_type pricing_type DEFAULT 'Flexible',
  base_price NUMERIC,
  duration_minutes INTEGER,
  kyc_required BOOLEAN DEFAULT FALSE
);

-- Tasker skills junction table
CREATE TABLE public.tasker_skills (
  tasker_id UUID NOT NULL REFERENCES public.taskers(tasker_id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(category_id) ON DELETE CASCADE,
  PRIMARY KEY (tasker_id, category_id)
);

-- Tasks table
CREATE TABLE public.tasks (
  task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(client_id),
  category_id UUID NOT NULL REFERENCES public.categories(category_id),
  address_id UUID NOT NULL REFERENCES public.addresses(address_id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget NUMERIC,
  status task_status DEFAULT 'Open',
  is_repeat BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offers table
CREATE TABLE public.offers (
  offer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(task_id) ON DELETE CASCADE,
  tasker_id UUID NOT NULL REFERENCES public.taskers(tasker_id) ON DELETE CASCADE,
  offered_price NUMERIC NOT NULL,
  offer_details JSONB,
  message TEXT,
  status offer_status DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (task_id, tasker_id)
);

-- Task messages table
CREATE TABLE public.task_messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(task_id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES public.users(userid),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings table
CREATE TABLE public.bookings (
  booking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID UNIQUE NOT NULL REFERENCES public.tasks(task_id),
  tasker_id UUID NOT NULL REFERENCES public.taskers(tasker_id),
  client_id UUID NOT NULL REFERENCES public.clients(client_id),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  final_cost NUMERIC NOT NULL,
  status booking_status DEFAULT 'Scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Booking recurrence table
CREATE TABLE public.booking_recurrence (
  recurrence_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(booking_id) ON DELETE CASCADE,
  frequency recurrence_frequency NOT NULL,
  day_of_week INTEGER,
  start_date DATE NOT NULL,
  end_date DATE
);

-- Payments table
CREATE TABLE public.payments (
  payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID UNIQUE NOT NULL REFERENCES public.bookings(booking_id),
  amount NUMERIC NOT NULL,
  platform_fee NUMERIC,
  tasker_payout NUMERIC,
  transaction_status transaction_status DEFAULT 'Authorized',
  paypal_authorization_id TEXT,
  paypal_capture_id TEXT,
  paypal_payout_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table
CREATE TABLE public.reviews (
  review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID UNIQUE NOT NULL REFERENCES public.bookings(booking_id),
  reviewer_id UUID NOT NULL REFERENCES public.users(userid),
  reviewed_id UUID NOT NULL REFERENCES public.users(userid),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasker KYC table
CREATE TABLE public.tasker_kyc (
  kyc_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tasker_id UUID UNIQUE NOT NULL REFERENCES public.taskers(tasker_id) ON DELETE CASCADE,
  document_type document_type,
  document_front_url TEXT,
  document_back_url TEXT,
  verification_status verification_status DEFAULT 'NotSubmitted',
  verification_date TIMESTAMPTZ
);

-- Admin actions table
CREATE TABLE public.admin_actions (
  action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.users(userid),
  action_type TEXT NOT NULL,
  target_user_id UUID REFERENCES public.users(userid),
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook logs table
CREATE TABLE public.webhook_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taskers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasker_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_recurrence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasker_kyc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users (users can see their own data)
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = userid);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = userid);

-- RLS Policies for clients
CREATE POLICY "Users can view own client profile" ON public.clients FOR SELECT USING (auth.uid() = userid);
CREATE POLICY "Users can create own client profile" ON public.clients FOR INSERT WITH CHECK (auth.uid() = userid);

-- RLS Policies for taskers
CREATE POLICY "Anyone can view active taskers" ON public.taskers FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Users can create own tasker profile" ON public.taskers FOR INSERT WITH CHECK (auth.uid() = userid);
CREATE POLICY "Users can update own tasker profile" ON public.taskers FOR UPDATE USING (auth.uid() = userid);

-- RLS Policies for addresses
CREATE POLICY "Users can view own addresses" ON public.addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own addresses" ON public.addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own addresses" ON public.addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own addresses" ON public.addresses FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for categories
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);

-- RLS Policies for tasker_skills
CREATE POLICY "Anyone can view tasker skills" ON public.tasker_skills FOR SELECT USING (true);
CREATE POLICY "Taskers can manage own skills" ON public.tasker_skills FOR ALL USING (
  auth.uid() IN (SELECT userid FROM public.taskers WHERE tasker_id = tasker_skills.tasker_id)
);

-- RLS Policies for tasks
CREATE POLICY "Anyone can view open tasks" ON public.tasks FOR SELECT USING (status = 'Open' OR auth.uid() IN (SELECT userid FROM public.clients WHERE client_id = tasks.client_id));
CREATE POLICY "Clients can create tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() IN (SELECT userid FROM public.clients WHERE client_id = tasks.client_id));
CREATE POLICY "Clients can update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() IN (SELECT userid FROM public.clients WHERE client_id = tasks.client_id));

-- RLS Policies for offers
CREATE POLICY "Task owners and taskers can view offers" ON public.offers FOR SELECT USING (
  auth.uid() IN (SELECT userid FROM public.taskers WHERE tasker_id = offers.tasker_id) OR
  auth.uid() IN (SELECT u.userid FROM public.clients c JOIN public.tasks t ON t.client_id = c.client_id JOIN public.users u ON u.userid = c.userid WHERE t.task_id = offers.task_id)
);
CREATE POLICY "Taskers can create offers" ON public.offers FOR INSERT WITH CHECK (auth.uid() IN (SELECT userid FROM public.taskers WHERE tasker_id = offers.tasker_id));

-- RLS Policies for task_messages
CREATE POLICY "Task participants can view messages" ON public.task_messages FOR SELECT USING (
  auth.uid() IN (
    SELECT u.userid FROM public.tasks t
    JOIN public.clients c ON c.client_id = t.client_id
    JOIN public.users u ON u.userid = c.userid
    WHERE t.task_id = task_messages.task_id
    UNION
    SELECT u.userid FROM public.offers o
    JOIN public.taskers tk ON tk.tasker_id = o.tasker_id
    JOIN public.users u ON u.userid = tk.userid
    WHERE o.task_id = task_messages.task_id
  )
);
CREATE POLICY "Task participants can send messages" ON public.task_messages FOR INSERT WITH CHECK (auth.uid() = sender_user_id);

-- RLS Policies for bookings
CREATE POLICY "Clients and taskers can view own bookings" ON public.bookings FOR SELECT USING (
  auth.uid() IN (SELECT userid FROM public.clients WHERE client_id = bookings.client_id) OR
  auth.uid() IN (SELECT userid FROM public.taskers WHERE tasker_id = bookings.tasker_id)
);

-- RLS Policies for payments
CREATE POLICY "Booking participants can view payments" ON public.payments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.booking_id = payments.booking_id
    AND (
      auth.uid() IN (SELECT userid FROM public.clients WHERE client_id = b.client_id) OR
      auth.uid() IN (SELECT userid FROM public.taskers WHERE tasker_id = b.tasker_id)
    )
  )
);

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews for own bookings" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- RLS Policies for tasker_kyc
CREATE POLICY "Taskers can view own KYC" ON public.tasker_kyc FOR SELECT USING (auth.uid() IN (SELECT userid FROM public.taskers WHERE tasker_id = tasker_kyc.tasker_id));
CREATE POLICY "Taskers can submit KYC" ON public.tasker_kyc FOR INSERT WITH CHECK (auth.uid() IN (SELECT userid FROM public.taskers WHERE tasker_id = tasker_kyc.tasker_id));
CREATE POLICY "Taskers can update own KYC" ON public.tasker_kyc FOR UPDATE USING (auth.uid() IN (SELECT userid FROM public.taskers WHERE tasker_id = tasker_kyc.tasker_id));

-- Admin policies (require admin role check)
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (role = 'Admin' AND auth.uid() = userid);
CREATE POLICY "Admins can view all tasker KYC" ON public.tasker_kyc FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE userid = auth.uid() AND role = 'Admin'));
CREATE POLICY "Admins can update tasker KYC" ON public.tasker_kyc FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE userid = auth.uid() AND role = 'Admin'));
CREATE POLICY "Admins can view admin actions" ON public.admin_actions FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE userid = auth.uid() AND role = 'Admin'));
CREATE POLICY "Admins can create admin actions" ON public.admin_actions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE userid = auth.uid() AND role = 'Admin'));

-- Function to calculate distance using Haversine formula
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
$$ LANGUAGE plpgsql IMMUTABLE;