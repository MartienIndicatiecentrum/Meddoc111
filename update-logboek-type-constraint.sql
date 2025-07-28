-- Update logboek table to allow new message types
-- This script updates the type constraint to allow the new message types

-- First, drop the existing constraint
ALTER TABLE public.logboek DROP CONSTRAINT IF EXISTS logboek_type_check;

-- Add the new constraint with updated values
ALTER TABLE public.logboek ADD CONSTRAINT logboek_type_check 
CHECK (type IN ('Vraag Verzekeraar', 'Indicatie', 'Anders') OR type IS NOT NULL);

-- Update existing records to use new types (optional)
-- UPDATE public.logboek SET type = 'Vraag Verzekeraar' WHERE type = 'Vraag';
-- UPDATE public.logboek SET type = 'Indicatie' WHERE type = 'Update';
-- UPDATE public.logboek SET type = 'Anders' WHERE type = 'Notitie';

-- Show the updated table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'logboek' 
AND column_name = 'type'; 