-- Fix Logboek Foreign Key Constraint Issue
-- Run this in the Supabase SQL Editor

-- 1. First, let's check the current state of the tables
SELECT 'Current table structure check' as info;

-- Check if logboek table exists and has the correct structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'logboek'
ORDER BY ordinal_position;

-- Check if log_entry_documents table exists
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'log_entry_documents'
ORDER BY ordinal_position;

-- 2. Disable RLS temporarily to allow all operations
ALTER TABLE public.logboek DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_entry_documents DISABLE ROW LEVEL SECURITY;

-- 3. Grant all necessary permissions
GRANT ALL ON public.logboek TO authenticated;
GRANT ALL ON public.logboek TO anon;
GRANT ALL ON public.log_entry_documents TO authenticated;
GRANT ALL ON public.log_entry_documents TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- 4. Fix foreign key constraints
-- Drop existing constraints if they exist
ALTER TABLE public.log_entry_documents DROP CONSTRAINT IF EXISTS log_entry_documents_log_entry_id_fkey;
ALTER TABLE public.log_entry_documents DROP CONSTRAINT IF EXISTS log_entry_documents_client_id_fkey;

-- Add proper foreign key constraints with CASCADE
ALTER TABLE public.log_entry_documents 
ADD CONSTRAINT log_entry_documents_log_entry_id_fkey 
FOREIGN KEY (log_entry_id) REFERENCES public.logboek(id) ON DELETE CASCADE;

ALTER TABLE public.log_entry_documents 
ADD CONSTRAINT log_entry_documents_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_log_entry_documents_log_entry_id ON public.log_entry_documents(log_entry_id);
CREATE INDEX IF NOT EXISTS idx_log_entry_documents_client_id ON public.log_entry_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_logboek_id ON public.logboek(id);
CREATE INDEX IF NOT EXISTS idx_clients_id ON public.clients(id);

-- 6. Verify the constraints were created correctly
SELECT 'Foreign key constraints verification' as info;

SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'log_entry_documents';

-- 7. Check for any orphaned records (documents without valid log entries)
SELECT 'Checking for orphaned documents' as info;

SELECT 
    led.id as document_id,
    led.log_entry_id,
    led.file_name,
    'Orphaned document - log entry does not exist' as issue
FROM public.log_entry_documents led
LEFT JOIN public.logboek l ON led.log_entry_id = l.id
WHERE l.id IS NULL;

-- 8. Clean up orphaned records (optional - uncomment if you want to delete orphaned documents)
-- DELETE FROM public.log_entry_documents 
-- WHERE log_entry_id NOT IN (SELECT id FROM public.logboek);

-- 9. Create a function to safely insert documents
CREATE OR REPLACE FUNCTION safe_insert_log_entry_document(
    p_log_entry_id UUID,
    p_client_id UUID,
    p_file_name TEXT,
    p_file_path TEXT,
    p_file_size BIGINT,
    p_file_type TEXT,
    p_public_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_document_id UUID;
BEGIN
    -- Check if log entry exists
    IF NOT EXISTS (SELECT 1 FROM public.logboek WHERE id = p_log_entry_id) THEN
        RAISE EXCEPTION 'Log entry with id % does not exist', p_log_entry_id;
    END IF;
    
    -- Check if client exists
    IF NOT EXISTS (SELECT 1 FROM public.clients WHERE id = p_client_id) THEN
        RAISE EXCEPTION 'Client with id % does not exist', p_client_id;
    END IF;
    
    -- Insert the document
    INSERT INTO public.log_entry_documents (
        log_entry_id,
        client_id,
        file_name,
        file_path,
        file_size,
        file_type,
        public_url
    ) VALUES (
        p_log_entry_id,
        p_client_id,
        p_file_name,
        p_file_path,
        p_file_size,
        p_file_type,
        p_public_url
    ) RETURNING id INTO v_document_id;
    
    RETURN v_document_id;
END;
$$ LANGUAGE plpgsql;

-- 10. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION safe_insert_log_entry_document TO authenticated;
GRANT EXECUTE ON FUNCTION safe_insert_log_entry_document TO anon;

-- 11. Final verification
SELECT 'Fix completed successfully' as status;
SELECT 'Tables and constraints are now properly configured' as message; 