-- Migrate existing converted leads to clients table
-- This script creates clients for leads that were converted before the automatic client creation was implemented

INSERT INTO clients (lead_id, nombre_empresa, tipo_cliente, tipo_cliente_otro, contacto, telefono, email, estado, notas)
SELECT 
  l.id as lead_id,
  l.nombre_empresa,
  l.tipo_cliente,
  l.tipo_cliente_otro,
  l.contacto,
  l.telefono,
  l.email,
  'Calificado' as estado,
  l.notas
FROM leads l
WHERE l.estado = 'Convertido' 
  AND l.convertido = true
  AND NOT EXISTS (
    SELECT 1 FROM clients c WHERE c.lead_id = l.id
  );

-- Update existing projects to link them to the new clients based on matching lead data
UPDATE projects p
SET client_id = c.id
FROM clients c
JOIN leads l ON c.lead_id = l.id
WHERE p.nombre = l.nombre_empresa
  AND p.client_id IS NULL
  AND l.proyecto_id = p.id;
