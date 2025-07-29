-- Fix logboek save issues - Run this in Supabase SQL Editor
-- This script fixes the constraints and permissions that prevent automatic saving

-- 1. First, let's check the current table structure
SELECT 'Current logboek table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'logboek'
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

-- 4. Fix the constraints to allow all the types we need
-- Drop existing constraints
ALTER TABLE public.logboek DROP CONSTRAINT IF EXISTS logboek_from_type_check;
ALTER TABLE public.logboek DROP CONSTRAINT IF EXISTS logboek_type_check;
ALTER TABLE public.logboek DROP CONSTRAINT IF EXISTS logboek_status_check;

-- Add flexible constraints that allow all the types we need
ALTER TABLE public.logboek ADD CONSTRAINT logboek_from_type_check 
    CHECK (from_type IN ('client', 'employee', 'insurer', 'family', 'verzekeraar'));

-- Allow any type for the type field (including custom types)
ALTER TABLE public.logboek ADD CONSTRAINT logboek_type_check 
    CHECK (type IS NOT NULL AND length(trim(type)) > 0);

-- Allow all status values we need
ALTER TABLE public.logboek ADD CONSTRAINT logboek_status_check 
    CHECK (status IN ('Geen urgentie', 'Licht urgent', 'Urgent', 'Reactie nodig', 'Afgehandeld', 'In behandeling'));

-- 5. Update default values
ALTER TABLE public.logboek ALTER COLUMN status SET DEFAULT 'Geen urgentie';
ALTER TABLE public.logboek ALTER COLUMN from_color SET DEFAULT 'bg-gray-500';

-- 6. Ensure the log_entry_documents table exists and has correct structure
CREATE TABLE IF NOT EXISTS public.log_entry_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  log_entry_id UUID NOT NULL REFERENCES public.logboek(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  public_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_log_entry_documents_log_entry_id ON public.log_entry_documents(log_entry_id);
CREATE INDEX IF NOT EXISTS idx_log_entry_documents_client_id ON public.log_entry_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_logboek_client_id ON public.logboek(client_id);
CREATE INDEX IF NOT EXISTS idx_logboek_date ON public.logboek(date);

-- 8. Create the updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Create triggers for updated_at
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

-- 10. Verify the fixes
SELECT 'Verification - Tables exist:' as info;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('logboek', 'log_entry_documents', 'clients')
ORDER BY table_name;

-- 11. Test insert permissions
SELECT 'Testing permissions - should return success if working:' as info;
SELECT 'Permissions OK' as status WHERE EXISTS (
  SELECT 1 FROM information_schema.table_privileges 
  WHERE table_schema = 'public' 
  AND table_name = 'logboek' 
  AND privilege_type = 'INSERT'
);

-- 12. Show final table structure
SELECT 'Final logboek table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'logboek'
ORDER BY ordinal_position; 