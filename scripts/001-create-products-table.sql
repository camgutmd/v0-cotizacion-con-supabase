-- Create products table for furniture quotation system
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  categoria VARCHAR(100) NOT NULL,
  subcategoria VARCHAR(100) NOT NULL,
  item VARCHAR(255) NOT NULL,
  proveedor VARCHAR(100) NOT NULL,
  costo DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster category lookups
CREATE INDEX idx_categoria ON products(categoria);
CREATE INDEX idx_subcategoria ON products(subcategoria);

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON products
  FOR SELECT
  TO public
  USING (true);

-- Create policy to allow authenticated users to insert/update
CREATE POLICY "Allow authenticated insert" ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON products
  FOR UPDATE
  TO authenticated
  USING (true);
