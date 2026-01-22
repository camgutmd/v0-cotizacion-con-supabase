-- Add razon_rechazo column to projects table for storing rejection reasons
ALTER TABLE projects ADD COLUMN IF NOT EXISTS razon_rechazo text;
