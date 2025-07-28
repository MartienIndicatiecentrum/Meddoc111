-- Test script to check if logboek table exists and show its structure
-- Run this in your Supabase SQL Editor

-- Check if logboek table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'logboek';

-- If table exists, show its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'logboek'
ORDER BY ordinal_position;

-- Check if there are any existing records
SELECT COUNT(*) as total_records FROM public.logboek;

-- Show sample records if any exist
SELECT * FROM public.logboek LIMIT 5; 