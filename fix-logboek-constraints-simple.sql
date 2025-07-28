-- Fix logboek table constraints - run this in Supabase SQL Editor

-- Drop existing constraints (ignore errors if they don't exist)
ALTER TABLE public.logboek DROP CONSTRAINT IF EXISTS logboek_from_type_check;
ALTER TABLE public.logboek DROP CONSTRAINT IF EXISTS logboek_status_check;

-- Add updated constraints
ALTER TABLE public.logboek ADD CONSTRAINT logboek_from_type_check 
    CHECK (from_type IN ('client', 'employee', 'insurer', 'family', 'verzekeraar'));

ALTER TABLE public.logboek ADD CONSTRAINT logboek_status_check 
    CHECK (status IN ('Geen urgentie', 'Licht urgent', 'Urgent', 'Reactie nodig', 'Afgehandeld', 'In behandeling'));

-- Update default status
ALTER TABLE public.logboek ALTER COLUMN status SET DEFAULT 'Geen urgentie';

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'logboek' 
AND table_schema = 'public'
ORDER BY ordinal_position; 