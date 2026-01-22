-- Add rejection fields to projects table
-- Run this script to add the columns for rejection tracking

ALTER TABLE projects ADD COLUMN IF NOT EXISTS razon_perdida TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS competidor TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS detalle_perdida TEXT;

-- Drop old column if it exists
ALTER TABLE projects DROP COLUMN IF EXISTS razon_rechazo;
