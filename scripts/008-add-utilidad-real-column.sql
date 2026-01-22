-- Add utilidad_real column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS utilidad_real NUMERIC(12, 2) DEFAULT NULL;
