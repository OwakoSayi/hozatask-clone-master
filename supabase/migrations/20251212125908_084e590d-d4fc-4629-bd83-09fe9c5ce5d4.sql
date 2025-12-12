-- ========================================
-- THUMBTACK-STYLE PRO LEAD PAYMENT SYSTEM
-- ========================================

-- 1. Create enum for subscription plans
CREATE TYPE public.subscription_plan AS ENUM ('free', 'basic', 'pro', 'unlimited');

-- 2. Create enum for verification status
CREATE TYPE public.verification_status AS ENUM ('none', 'pending', 'verified', 'top_pro');

-- 3. Pro credits and subscription tracking
CREATE TABLE public.pro_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE UNIQUE,
  credits INTEGER NOT NULL DEFAULT 0,
  subscription_plan subscription_plan NOT NULL DEFAULT 'free',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  verification_status verification_status NOT NULL DEFAULT 'none',
  background_check_completed BOOLEAN DEFAULT false,
  license_verified BOOLEAN DEFAULT false,
  response_rate NUMERIC(3,2) DEFAULT 0,
  avg_response_time_hours INTEGER,
  total_leads_purchased INTEGER DEFAULT 0,
  total_hires INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on pro_accounts
ALTER TABLE public.pro_accounts ENABLE ROW LEVEL SECURITY;

-- Policies for pro_accounts
CREATE POLICY "Suppliers can view own pro account"
  ON public.pro_accounts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM suppliers WHERE suppliers.id = pro_accounts.supplier_id AND suppliers.user_id = auth.uid()
  ));

CREATE POLICY "Suppliers can update own pro account"
  ON public.pro_accounts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM suppliers WHERE suppliers.id = pro_accounts.supplier_id AND suppliers.user_id = auth.uid()
  ));

CREATE POLICY "System can insert pro accounts"
  ON public.pro_accounts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM suppliers WHERE suppliers.id = pro_accounts.supplier_id AND suppliers.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all pro accounts"
  ON public.pro_accounts FOR ALL
  USING (is_admin(auth.uid()));

-- 4. Credit transactions for pros
CREATE TABLE public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pro_account_id UUID NOT NULL REFERENCES public.pro_accounts(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL, -- 'purchase', 'spend', 'refund', 'bonus', 'subscription'
  description TEXT,
  quote_id UUID REFERENCES public.quotes(id),
  payment_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers can view own transactions"
  ON public.credit_transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM pro_accounts pa
    JOIN suppliers s ON s.id = pa.supplier_id
    WHERE pa.id = credit_transactions.pro_account_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "System can insert transactions"
  ON public.credit_transactions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM pro_accounts pa
    JOIN suppliers s ON s.id = pa.supplier_id
    WHERE pa.id = credit_transactions.pro_account_id AND s.user_id = auth.uid()
  ));

-- 5. Credit packages for purchase
CREATE TABLE public.credit_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  bonus_credits INTEGER DEFAULT 0,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active packages"
  ON public.credit_packages FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage packages"
  ON public.credit_packages FOR ALL
  USING (is_admin(auth.uid()));

-- Insert default credit packages
INSERT INTO public.credit_packages (name, credits, price_cents, bonus_credits, is_popular) VALUES
  ('Starter', 5, 9900, 0, false),
  ('Growth', 15, 24900, 2, true),
  ('Pro', 30, 44900, 5, false),
  ('Enterprise', 60, 79900, 15, false);

-- 6. Subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan subscription_plan NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price_cents_monthly INTEGER NOT NULL,
  leads_per_month INTEGER,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view plans"
  ON public.subscription_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage plans"
  ON public.subscription_plans FOR ALL
  USING (is_admin(auth.uid()));

-- Insert default subscription plans
INSERT INTO public.subscription_plans (plan, name, price_cents_monthly, leads_per_month, features) VALUES
  ('free', 'Free', 0, 0, '{"instant_match": false, "priority_listing": false, "verified_badge": false}'),
  ('basic', 'Basic', 29900, 10, '{"instant_match": false, "priority_listing": false, "verified_badge": false}'),
  ('pro', 'Pro', 59900, 30, '{"instant_match": true, "priority_listing": true, "verified_badge": true}'),
  ('unlimited', 'Unlimited', 99900, NULL, '{"instant_match": true, "priority_listing": true, "verified_badge": true, "top_pro_eligible": true}');

-- 7. Instant Match settings per supplier category
CREATE TABLE public.instant_match_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  max_distance_km INTEGER DEFAULT 50,
  auto_quote_message TEXT,
  auto_quote_price_min NUMERIC,
  auto_quote_price_max NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, category)
);

ALTER TABLE public.instant_match_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers can manage own instant match"
  ON public.instant_match_settings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM suppliers WHERE suppliers.id = instant_match_settings.supplier_id AND suppliers.user_id = auth.uid()
  ));

-- 8. In-app messaging
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL, -- 'customer' or 'supplier'
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES public.project_requests(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  quote_id UUID REFERENCES public.quotes(id),
  last_message_at TIMESTAMP WITH TIME ZONE,
  customer_unread_count INTEGER DEFAULT 0,
  supplier_unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS for conversations
CREATE POLICY "Customers can view own conversations"
  ON public.conversations FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Suppliers can view own conversations"
  ON public.conversations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM suppliers WHERE suppliers.id = conversations.supplier_id AND suppliers.user_id = auth.uid()
  ));

CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (customer_id = auth.uid() OR EXISTS (
    SELECT 1 FROM suppliers WHERE suppliers.id = conversations.supplier_id AND suppliers.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own conversations"
  ON public.conversations FOR UPDATE
  USING (customer_id = auth.uid() OR EXISTS (
    SELECT 1 FROM suppliers WHERE suppliers.id = conversations.supplier_id AND suppliers.user_id = auth.uid()
  ));

-- RLS for messages
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (c.customer_id = auth.uid() OR EXISTS (
      SELECT 1 FROM suppliers WHERE suppliers.id = c.supplier_id AND suppliers.user_id = auth.uid()
    ))
  ));

CREATE POLICY "Users can send messages in their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (c.customer_id = auth.uid() OR EXISTS (
      SELECT 1 FROM suppliers WHERE suppliers.id = c.supplier_id AND suppliers.user_id = auth.uid()
    ))
  ));

-- 9. Cost guides
CREATE TABLE public.cost_guides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL UNIQUE,
  avg_price_min NUMERIC NOT NULL,
  avg_price_max NUMERIC NOT NULL,
  price_factors JSONB,
  typical_duration TEXT,
  description TEXT,
  tips TEXT[],
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cost_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cost guides"
  ON public.cost_guides FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage cost guides"
  ON public.cost_guides FOR ALL
  USING (is_admin(auth.uid()));

-- Insert sample cost guides
INSERT INTO public.cost_guides (category, avg_price_min, avg_price_max, typical_duration, description, tips) VALUES
  ('Cleaning', 300, 800, '2-4 hours', 'Professional house cleaning services', ARRAY['Get quotes from 3+ pros', 'Check reviews and ratings', 'Ask about supplies included']),
  ('Plumbing', 500, 2000, '1-3 hours', 'Plumbing repairs and installations', ARRAY['Describe the issue in detail', 'Ask about warranty', 'Check licensing']),
  ('Electrical', 600, 2500, '1-4 hours', 'Electrical repairs and installations', ARRAY['Verify electrician certification', 'Get itemized quotes', 'Ask about permits']),
  ('Moving', 1500, 5000, '4-8 hours', 'Local and long-distance moving services', ARRAY['Get in-home estimates', 'Check insurance coverage', 'Book 2-4 weeks ahead']);

-- 10. Add lead_cost column to project_requests for variable pricing
ALTER TABLE public.project_requests 
ADD COLUMN lead_cost_credits INTEGER DEFAULT 1;

-- 11. Add credits_spent to quotes to track cost per quote
ALTER TABLE public.quotes
ADD COLUMN credits_spent INTEGER DEFAULT 1;

-- 12. Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- 13. Function to create pro account when supplier is approved
CREATE OR REPLACE FUNCTION public.create_pro_account_on_supplier_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'Active' AND (OLD.status IS NULL OR OLD.status != 'Active') THEN
    INSERT INTO public.pro_accounts (supplier_id, credits)
    VALUES (NEW.id, 3) -- Give 3 free credits on approval
    ON CONFLICT (supplier_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_supplier_approved
  AFTER INSERT OR UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.create_pro_account_on_supplier_approval();

-- 14. Updated_at triggers
CREATE TRIGGER update_pro_accounts_updated_at
  BEFORE UPDATE ON public.pro_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_instant_match_updated_at
  BEFORE UPDATE ON public.instant_match_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();