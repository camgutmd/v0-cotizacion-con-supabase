-- Create clients table for managing converted leads
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  nombre_empresa VARCHAR(255) NOT NULL,
  contacto VARCHAR(255),
  email VARCHAR(255),
  telefono VARCHAR(50),
  tipo_cliente TEXT,
  tipo_cliente_otro TEXT,
  estado VARCHAR(50) DEFAULT 'Calificado', -- 'Calificado' or 'Activo'
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access" ON clients FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON clients FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON clients FOR DELETE USING (true);

-- Add client_id to projects table to link projects to clients
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
