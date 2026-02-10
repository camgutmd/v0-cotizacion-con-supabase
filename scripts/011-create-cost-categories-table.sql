-- Create cost_categories table
CREATE TABLE IF NOT EXISTS cost_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria VARCHAR NOT NULL,
  subcategoria VARCHAR NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cost_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON cost_categories FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON cost_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON cost_categories FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON cost_categories FOR DELETE USING (true);

-- Seed initial categories
INSERT INTO cost_categories (categoria, subcategoria) VALUES
  ('Produccion', 'Produccion'),
  ('Produccion', 'Transporte'),
  ('Produccion', 'Instalacion'),
  ('Administrativos', 'Administrativos'),
  ('Ventas', 'Mercadeo'),
  ('Ventas', 'Promocion');
