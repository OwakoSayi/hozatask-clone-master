-- Create project_requests table for customer project submissions
CREATE TABLE public.project_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  zip_code TEXT,
  preferred_date DATE,
  preferred_time TEXT,
  budget_min NUMERIC,
  budget_max NUMERIC,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'hired', 'closed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quotes table for pro responses
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.project_requests(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  message TEXT NOT NULL,
  estimated_duration TEXT,
  is_read BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(request_id, supplier_id)
);

-- Enable RLS
ALTER TABLE public.project_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_requests
CREATE POLICY "Users can view their own requests" 
  ON public.project_requests FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create requests" 
  ON public.project_requests FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own requests" 
  ON public.project_requests FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Active suppliers can view open requests in their category" 
  ON public.project_requests FOR SELECT 
  USING (
    status = 'open' AND
    EXISTS (
      SELECT 1 FROM public.suppliers 
      WHERE suppliers.user_id = auth.uid() 
      AND suppliers.status = 'Active'
      AND suppliers.category = project_requests.category
    )
  );

CREATE POLICY "Admins can view all requests" 
  ON public.project_requests FOR SELECT 
  USING (is_admin(auth.uid()));

-- RLS policies for quotes
CREATE POLICY "Suppliers can view their own quotes" 
  ON public.quotes FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.suppliers 
      WHERE suppliers.id = quotes.supplier_id 
      AND suppliers.user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can view quotes on their requests" 
  ON public.quotes FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.project_requests 
      WHERE project_requests.id = quotes.request_id 
      AND project_requests.user_id = auth.uid()
    )
  );

CREATE POLICY "Active suppliers can create quotes" 
  ON public.quotes FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      JOIN public.project_requests pr ON pr.category = s.category
      WHERE s.id = quotes.supplier_id 
      AND s.user_id = auth.uid()
      AND s.status = 'Active'
      AND pr.id = quotes.request_id
      AND pr.status = 'open'
    )
  );

CREATE POLICY "Suppliers can update their own quotes" 
  ON public.quotes FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.suppliers 
      WHERE suppliers.id = quotes.supplier_id 
      AND suppliers.user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can update quote status on their requests" 
  ON public.quotes FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.project_requests 
      WHERE project_requests.id = quotes.request_id 
      AND project_requests.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all quotes" 
  ON public.quotes FOR ALL 
  USING (is_admin(auth.uid()));

-- Create updated_at triggers
CREATE TRIGGER update_project_requests_updated_at
  BEFORE UPDATE ON public.project_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for quotes
ALTER PUBLICATION supabase_realtime ADD TABLE public.quotes;