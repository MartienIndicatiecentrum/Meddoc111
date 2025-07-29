-- Check and fix foreign key constraints
-- Run this in the Supabase SQL Editor

-- 1. Check existing foreign key constraints
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('log_entry_documents', 'logboek', 'clients');

-- 2. Drop existing foreign key constraints if they exist
ALTER TABLE log_entry_documents DROP CONSTRAINT IF EXISTS log_entry_documents_log_entry_id_fkey;
ALTER TABLE log_entry_documents DROP CONSTRAINT IF EXISTS log_entry_documents_client_id_fkey;

-- 3. Add proper foreign key constraints
ALTER TABLE log_entry_documents 
ADD CONSTRAINT log_entry_documents_log_entry_id_fkey 
FOREIGN KEY (log_entry_id) REFERENCES logboek(id) ON DELETE CASCADE;

ALTER TABLE log_entry_documents 
ADD CONSTRAINT log_entry_documents_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- 4. Verify the constraints were created
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'log_entry_documents'; 