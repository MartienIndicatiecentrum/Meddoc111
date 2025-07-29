-- Simple fix for RLS issues
-- Run this in the Supabase SQL Editor

-- 1. Disable RLS on all related tables
ALTER TABLE log_entry_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE logboek DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

-- 2. Grant all permissions
GRANT ALL ON log_entry_documents TO authenticated;
GRANT ALL ON log_entry_documents TO anon;
GRANT ALL ON logboek TO authenticated;
GRANT ALL ON logboek TO anon;
GRANT ALL ON clients TO authenticated;
GRANT ALL ON clients TO anon;

-- 3. Grant schema usage
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- 4. Verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('logboek', 'log_entry_documents', 'clients')
ORDER BY table_name; 