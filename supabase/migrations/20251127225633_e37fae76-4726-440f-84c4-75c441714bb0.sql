-- Add a single price column to service_options
ALTER TABLE service_options 
ADD COLUMN IF NOT EXISTS price numeric;

-- Migrate existing data: use price_min as the single price
UPDATE service_options 
SET price = price_min 
WHERE price IS NULL;

-- Make price NOT NULL after migration
ALTER TABLE service_options 
ALTER COLUMN price SET NOT NULL;

-- Drop the old price range columns
ALTER TABLE service_options 
DROP COLUMN IF EXISTS price_min,
DROP COLUMN IF EXISTS price_max;

-- Update suppliers table to use single price as well
ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS price numeric;

-- Migrate suppliers data
UPDATE suppliers 
SET price = min_price 
WHERE price IS NULL;

-- Drop old columns from suppliers
ALTER TABLE suppliers 
DROP COLUMN IF EXISTS min_price,
DROP COLUMN IF EXISTS max_price;