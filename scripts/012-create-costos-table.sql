-- Create costos table
CREATE TABLE IF NOT EXISTS costos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria VARCHAR NOT NULL,
  subcategoria VARCHAR NOT NULL,
  detalle TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
  proveedor_nombre VARCHAR,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  monto NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE costos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON costos FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON costos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON costos FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON costos FOR DELETE USING (true);
