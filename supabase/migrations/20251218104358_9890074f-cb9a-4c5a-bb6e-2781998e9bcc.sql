-- Create trigger to automatically create pro_accounts when supplier is inserted
CREATE OR REPLACE FUNCTION public.create_pro_account_for_supplier()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.pro_accounts (supplier_id, credits, verification_status)
  VALUES (NEW.id, 5, 'none')
  ON CONFLICT (supplier_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger
DROP TRIGGER IF EXISTS on_supplier_created ON public.suppliers;
CREATE TRIGGER on_supplier_created
  AFTER INSERT ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.create_pro_account_for_supplier();

-- Also create pro_accounts for any existing suppliers that don't have one
INSERT INTO public.pro_accounts (supplier_id, credits, verification_status)
SELECT s.id, 5, 'none'
FROM public.suppliers s
LEFT JOIN public.pro_accounts pa ON pa.supplier_id = s.id
WHERE pa.id IS NULL;