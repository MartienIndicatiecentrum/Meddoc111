-- Disable RLS for development (temporary solution)
-- Run this in the Supabase SQL Editor

-- Disable RLS on log_entry_documents table
ALTER TABLE log_entry_documents DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on related tables if needed
ALTER TABLE logboek DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

-- Grant all permissions
GRANT ALL ON log_entry_documents TO authenticated;
GRANT ALL ON log_entry_documents TO anon;
GRANT ALL ON logboek TO authenticated;
GRANT ALL ON logboek TO anon;
GRANT ALL ON clients TO authenticated;
GRANT ALL ON clients TO anon;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon; 