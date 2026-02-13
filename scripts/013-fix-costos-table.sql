-- Drop and recreate costos table with proper schema
DROP TABLE IF EXISTS costos;

CREATE TABLE costos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria_id UUID REFERENCES cost_categories(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
  descripcion TEXT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  monto NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE costos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON costos FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON costos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON costos FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON costos FOR DELETE USING (true);
