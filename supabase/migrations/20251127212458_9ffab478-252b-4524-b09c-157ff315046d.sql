-- Enable realtime for service_options table
ALTER TABLE public.service_options REPLICA IDENTITY FULL;

-- Add service_options table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_options;