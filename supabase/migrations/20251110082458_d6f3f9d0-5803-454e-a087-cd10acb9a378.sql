-- Update categories to South African market categories
DELETE FROM categories;

INSERT INTO categories (name, description, icon_url) VALUES
  ('Cleaning', 'Professional cleaning services for homes and offices', NULL),
  ('Assembly', 'Furniture assembly and installation services', NULL),
  ('Mounting', 'TV mounting, picture hanging, and shelf installation', NULL),
  ('Moving', 'Moving and relocation assistance', NULL),
  ('Outdoor Help', 'Garden maintenance, lawn care, and outdoor tasks', NULL),
  ('Home Repairs', 'General home repairs and maintenance', NULL),
  ('Painting', 'Interior and exterior painting services', NULL);