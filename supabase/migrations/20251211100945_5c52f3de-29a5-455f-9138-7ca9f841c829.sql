-- Create a public view for suppliers without sensitive contact info
CREATE OR REPLACE VIEW public.public_suppliers AS
SELECT 
  id,
  business_name,
  category,
  title,
  description,
  images,
  location,
  price,
  time_frame,
  status,
  created_at
FROM public.suppliers
WHERE status = 'Active'::supplier_status;

-- Create a public view for service options without supplier_id link
CREATE OR REPLACE VIEW public.public_service_options AS
SELECT 
  id,
  category,
  title,
  description,
  images,
  price,
  time_frame,
  location_area,
  is_active,
  created_at
FROM public.service_options
WHERE is_active = true;

-- Grant SELECT on views to anonymous users
GRANT SELECT ON public.public_suppliers TO anon;
GRANT SELECT ON public.public_service_options TO anon;
GRANT SELECT ON public.public_suppliers TO authenticated;
GRANT SELECT ON public.public_service_options TO authenticated;