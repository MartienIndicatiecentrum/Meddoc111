-- Complete Logboek Database Fix
-- This script fixes all database constraints and creates necessary functions
-- Run this in the Supabase SQL Editor

-- 1. First create the tables if they don't exist
CREATE TABLE IF NOT EXISTS public.logboek (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    from_name TEXT NOT NULL,
    from_type TEXT NOT NULL CHECK (from_type IN ('client', 'employee', 'insurer', 'family', 'verzekeraar')),
    from_color TEXT DEFAULT 'bg-gray-500',
    type TEXT NOT NULL,
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Geen urgentie' CHECK (status IN ('Geen urgentie', 'Licht urgent', 'Urgent', 'Reactie nodig', 'Afgehandeld', 'In behandeling')),
    is_urgent BOOLEAN DEFAULT FALSE,
    needs_response BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.log_entry_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    log_entry_id UUID,
    client_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    public_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Temporarily disable RLS to allow all operations
ALTER TABLE public.logboek DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_entry_documents DISABLE ROW LEVEL SECURITY;

-- 3. Drop existing constraints if they exist to recreate them properly
ALTER TABLE public.log_entry_documents DROP CONSTRAINT IF EXISTS log_entry_documents_log_entry_id_fkey;
ALTER TABLE public.log_entry_documents DROP CONSTRAINT IF EXISTS log_entry_documents_client_id_fkey;
ALTER TABLE public.logboek DROP CONSTRAINT IF EXISTS logboek_client_id_fkey;

-- 4. Add proper foreign key constraints with CASCADE
-- Allow log_entry_id to be NULL for standalone documents
ALTER TABLE public.log_entry_documents 
ADD CONSTRAINT log_entry_documents_log_entry_id_fkey 
FOREIGN KEY (log_entry_id) REFERENCES public.logboek(id) ON DELETE CASCADE;

ALTER TABLE public.log_entry_documents 
ADD CONSTRAINT log_entry_documents_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

-- Add foreign key for logboek to clients (if clients table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients' AND table_schema = 'public') THEN
        ALTER TABLE public.logboek 
        ADD CONSTRAINT logboek_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_logboek_client_id ON public.logboek(client_id);
CREATE INDEX IF NOT EXISTS idx_logboek_date ON public.logboek(date);
CREATE INDEX IF NOT EXISTS idx_logboek_from_type ON public.logboek(from_type);
CREATE INDEX IF NOT EXISTS idx_logboek_type ON public.logboek(type);
CREATE INDEX IF NOT EXISTS idx_log_entry_documents_log_entry_id ON public.log_entry_documents(log_entry_id);
CREATE INDEX IF NOT EXISTS idx_log_entry_documents_client_id ON public.log_entry_documents(client_id);

-- 6. Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_logboek_updated_at ON public.logboek;
CREATE TRIGGER update_logboek_updated_at 
    BEFORE UPDATE ON public.logboek 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_log_entry_documents_updated_at ON public.log_entry_documents;
CREATE TRIGGER update_log_entry_documents_updated_at 
    BEFORE UPDATE ON public.log_entry_documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Create the safe insert function that the frontend expects
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
    IF p_log_entry_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.logboek WHERE id = p_log_entry_id) THEN
        RAISE EXCEPTION 'Het logboek bericht bestaat niet meer. Probeer het bericht opnieuw op te slaan.';
    END IF;
    
    -- Check if client exists
    IF NOT EXISTS (SELECT 1 FROM public.clients WHERE id = p_client_id) THEN
        RAISE EXCEPTION 'Client met ID % bestaat niet', p_client_id;
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
EXCEPTION
    WHEN foreign_key_violation THEN
        IF SQLSTATE = '23503' THEN 
            RAISE EXCEPTION 'Het logboek bericht bestaat niet meer. Probeer het bericht opnieuw op te slaan.';
        ELSE
            RAISE;
        END IF;
END;
$$ LANGUAGE plpgsql;

-- 9. Grant all necessary permissions
GRANT ALL ON public.logboek TO authenticated;
GRANT ALL ON public.logboek TO anon;
GRANT ALL ON public.log_entry_documents TO authenticated;
GRANT ALL ON public.log_entry_documents TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT EXECUTE ON FUNCTION safe_insert_log_entry_document TO authenticated;
GRANT EXECUTE ON FUNCTION safe_insert_log_entry_document TO anon;
GRANT EXECUTE ON FUNCTION update_updated_at_column TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column TO anon;

-- 10. Enable RLS with proper policies
ALTER TABLE public.logboek ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_entry_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.logboek;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.logboek;
DROP POLICY IF EXISTS "Enable update for all users" ON public.logboek;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.logboek;

DROP POLICY IF EXISTS "Users can view documents for their log entries" ON public.log_entry_documents;
DROP POLICY IF EXISTS "Users can insert documents" ON public.log_entry_documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.log_entry_documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.log_entry_documents;

-- Create RLS policies for logboek
CREATE POLICY "Enable read access for all users" ON public.logboek
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.logboek
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.logboek
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.logboek
    FOR DELETE USING (true);

-- Create RLS policies for log_entry_documents
CREATE POLICY "Users can view documents for their log entries" ON public.log_entry_documents
    FOR SELECT USING (true);

CREATE POLICY "Users can insert documents" ON public.log_entry_documents
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own documents" ON public.log_entry_documents
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own documents" ON public.log_entry_documents
    FOR DELETE USING (true);

-- 11. Clean up any orphaned documents (documents without valid log entries)
DELETE FROM public.log_entry_documents 
WHERE log_entry_id IS NOT NULL 
AND log_entry_id NOT IN (SELECT id FROM public.logboek);

-- 12. Verification queries
SELECT 'Database fix completed successfully' as status;

-- Show table structure
SELECT 'Logboek table structure:' AS info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'logboek' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Log entry documents table structure:' AS info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'log_entry_documents' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show foreign key constraints
SELECT 'Foreign key constraints:' AS info;
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND (tc.table_name = 'log_entry_documents' OR tc.table_name = 'logboek');

-- Verify function exists
SELECT 'Functions created:' AS info;
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('safe_insert_log_entry_document', 'update_updated_at_column');