-- Add time_frame column to service_options table
ALTER TABLE service_options 
ADD COLUMN time_frame TEXT DEFAULT 'per service';

-- Add time_frame column to suppliers table as well for consistency
ALTER TABLE suppliers 
ADD COLUMN time_frame TEXT DEFAULT 'per service';