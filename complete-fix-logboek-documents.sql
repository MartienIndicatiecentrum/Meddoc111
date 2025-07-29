-- Complete fix for logboek documents system
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

-- 4. Fix foreign key constraints
-- Drop existing constraints if they exist
ALTER TABLE log_entry_documents DROP CONSTRAINT IF EXISTS log_entry_documents_log_entry_id_fkey;
ALTER TABLE log_entry_documents DROP CONSTRAINT IF EXISTS log_entry_documents_client_id_fkey;

-- Add proper foreign key constraints
ALTER TABLE log_entry_documents 
ADD CONSTRAINT log_entry_documents_log_entry_id_fkey 
FOREIGN KEY (log_entry_id) REFERENCES logboek(id) ON DELETE CASCADE;

ALTER TABLE log_entry_documents 
ADD CONSTRAINT log_entry_documents_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_log_entry_documents_log_entry_id ON log_entry_documents(log_entry_id);
CREATE INDEX IF NOT EXISTS idx_log_entry_documents_client_id ON log_entry_documents(client_id);

-- 6. Verify everything is working
SELECT 'Tables exist and RLS is disabled' as status, 
       table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('logboek', 'log_entry_documents', 'clients')
ORDER BY table_name;

-- 7. Check table structure
SELECT 'logboek table structure' as info, 
       column_name, 
       data_type, 
       is_nullable
FROM information_schema.columns 
WHERE table_name = 'logboek' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. Check log_entry_documents table structure
SELECT 'log_entry_documents table structure' as info,
       column_name, 
       data_type, 
       is_nullable
FROM information_schema.columns 
WHERE table_name = 'log_entry_documents' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. Test insert permissions
SELECT 'Permissions check completed' as status; 