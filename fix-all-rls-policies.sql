-- Fix all RLS policies for the logboek system
-- Run this in the Supabase SQL Editor

-- 1. Fix log_entry_documents table RLS
ALTER TABLE log_entry_documents DISABLE ROW LEVEL SECURITY;

-- 2. Fix logboek table RLS
ALTER TABLE logboek DISABLE ROW LEVEL SECURITY;

-- 3. Fix clients table RLS (if it exists)
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

-- 4. Grant all permissions to authenticated and anon users
GRANT ALL ON log_entry_documents TO authenticated;
GRANT ALL ON log_entry_documents TO anon;
GRANT ALL ON logboek TO authenticated;
GRANT ALL ON logboek TO anon;
GRANT ALL ON clients TO authenticated;
GRANT ALL ON clients TO anon;

-- 5. Grant schema usage
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- 6. Verify the tables exist and have the right structure
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('logboek', 'log_entry_documents', 'clients')
ORDER BY table_name;

-- 7. Check if logboek table has the right columns
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'logboek' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. Check if log_entry_documents table has the right columns
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'log_entry_documents' 
AND table_schema = 'public'
ORDER BY ordinal_position; 