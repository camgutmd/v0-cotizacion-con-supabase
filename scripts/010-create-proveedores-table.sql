-- Create proveedores table
CREATE TABLE IF NOT EXISTS proveedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR NOT NULL,
  contacto VARCHAR,
  telefono VARCHAR,
  correo VARCHAR,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Allow public read access" ON proveedores FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON proveedores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON proveedores FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON proveedores FOR DELETE USING (true);
