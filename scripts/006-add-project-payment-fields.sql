-- Add payment and delivery fields to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS adelanto VARCHAR(20) DEFAULT 'No';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS porcentaje_adelanto DECIMAL(5,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS monto_adelanto DECIMAL(15,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS saldo DECIMAL(15,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS fecha_entrega DATE;
