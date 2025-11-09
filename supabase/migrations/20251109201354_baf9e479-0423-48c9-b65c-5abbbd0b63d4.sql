-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('client', 'tasker');

-- Create enum for booking status
CREATE TYPE public.booking_status AS ENUM ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create tasks table (service listings by taskers)
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tasker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  location TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tasker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_date TIMESTAMPTZ NOT NULL,
  hours DECIMAL(5,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view all roles"
  ON public.user_roles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Categories policies (public read)
CREATE POLICY "Anyone can view categories"
  ON public.categories FOR SELECT
  USING (true);

-- Tasks policies
CREATE POLICY "Anyone can view active tasks"
  ON public.tasks FOR SELECT
  USING (is_active = true OR tasker_id = auth.uid());

CREATE POLICY "Taskers can create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = tasker_id);

CREATE POLICY "Taskers can update own tasks"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = tasker_id);

CREATE POLICY "Taskers can delete own tasks"
  ON public.tasks FOR DELETE
  USING (auth.uid() = tasker_id);

-- Bookings policies
CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = tasker_id);

CREATE POLICY "Clients can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update own bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = client_id OR auth.uid() = tasker_id);

-- Reviews policies
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews for their bookings"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- Create function for updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default categories
INSERT INTO public.categories (name, description) VALUES
  ('Cleaning', 'Home and office cleaning services'),
  ('Handyman', 'Home repairs and maintenance'),
  ('Moving', 'Moving and delivery services'),
  ('Assembly', 'Furniture assembly and installation'),
  ('Painting', 'Interior and exterior painting'),
  ('Gardening', 'Lawn care and landscaping'),
  ('Plumbing', 'Plumbing repairs and installation'),
  ('Electrical', 'Electrical work and repairs');