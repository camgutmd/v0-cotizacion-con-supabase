-- Add fecha_real column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS fecha_real DATE;

-- Update existing 'Cerrado' status to 'Finalizado'
UPDATE projects SET estatus = 'Finalizado' WHERE estatus = 'Cerrado';
