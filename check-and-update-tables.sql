-- Check and Update Tables Script
-- This script will check existing table structures and only add missing columns

-- First, let's see what tables exist and their current structure
SELECT 'EXISTING TABLES:' as info;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('clients', 'Taken', 'taken', 'logboek')
ORDER BY table_name;

-- Check the structure of the clients table
SELECT 'CLIENTS TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'clients'
ORDER BY ordinal_position;

-- Check the structure of the Taken table (uppercase)
SELECT 'TAKEN TABLE STRUCTURE (UPPERCASE):' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'Taken'
ORDER BY ordinal_position;

-- Check the structure of the taken table (lowercase)
SELECT 'TAKEN TABLE STRUCTURE (LOWERCASE):' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'taken'
ORDER BY ordinal_position;

-- Check the structure of the logboek table
SELECT 'LOGBOEK TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'logboek'
ORDER BY ordinal_position;

-- Now let's add missing columns to existing tables (only if they don't exist)

-- Add missing columns to clients table
DO $$ 
BEGIN
    -- Check if 'name' column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'name') THEN
        ALTER TABLE public.clients ADD COLUMN name TEXT;
        RAISE NOTICE 'Added name column to clients table';
    END IF;
    
    -- Check if 'email' column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'email') THEN
        ALTER TABLE public.clients ADD COLUMN email TEXT;
        RAISE NOTICE 'Added email column to clients table';
    END IF;
    
    -- Check if 'phone' column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'phone') THEN
        ALTER TABLE public.clients ADD COLUMN phone TEXT;
        RAISE NOTICE 'Added phone column to clients table';
    END IF;
    
    -- Check if 'address' column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'address') THEN
        ALTER TABLE public.clients ADD COLUMN address TEXT;
        RAISE NOTICE 'Added address column to clients table';
    END IF;
    
    -- Check if 'city' column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'city') THEN
        ALTER TABLE public.clients ADD COLUMN city TEXT;
        RAISE NOTICE 'Added city column to clients table';
    END IF;
    
    -- Check if 'postal_code' column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'postal_code') THEN
        ALTER TABLE public.clients ADD COLUMN postal_code TEXT;
        RAISE NOTICE 'Added postal_code column to clients table';
    END IF;
    
    -- Check if 'date_of_birth' column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'date_of_birth') THEN
        ALTER TABLE public.clients ADD COLUMN date_of_birth DATE;
        RAISE NOTICE 'Added date_of_birth column to clients table';
    END IF;
    
    -- Check if 'bsn_number' column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'bsn_number') THEN
        ALTER TABLE public.clients ADD COLUMN bsn_number TEXT;
        RAISE NOTICE 'Added bsn_number column to clients table';
    END IF;
    
    -- Check if 'insurance_number' column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'insurance_number') THEN
        ALTER TABLE public.clients ADD COLUMN insurance_number TEXT;
        RAISE NOTICE 'Added insurance_number column to clients table';
    END IF;
    
    -- Check if 'insurance_company' column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'insurance_company') THEN
        ALTER TABLE public.clients ADD COLUMN insurance_company TEXT;
        RAISE NOTICE 'Added insurance_company column to clients table';
    END IF;
    
    -- Check if 'contact_person_name' column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'contact_person_name') THEN
        ALTER TABLE public.clients ADD COLUMN contact_person_name TEXT;
        RAISE NOTICE 'Added contact_person_name column to clients table';
    END IF;
    
    -- Check if 'contact_person_phone' column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'contact_person_phone') THEN
        ALTER TABLE public.clients ADD COLUMN contact_person_phone TEXT;
        RAISE NOTICE 'Added contact_person_phone column to clients table';
    END IF;
    
    -- Check if 'contact_person_email' column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'contact_person_email') THEN
        ALTER TABLE public.clients ADD COLUMN contact_person_email TEXT;
        RAISE NOTICE 'Added contact_person_email column to clients table';
    END IF;
    
    -- Check if 'contact_person_relation' column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'contact_person_relation') THEN
        ALTER TABLE public.clients ADD COLUMN contact_person_relation TEXT;
        RAISE NOTICE 'Added contact_person_relation column to clients table';
    END IF;
    
    -- Check if 'status' column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'status') THEN
        ALTER TABLE public.clients ADD COLUMN status TEXT DEFAULT 'active';
        RAISE NOTICE 'Added status column to clients table';
    END IF;
    
    -- Check if 'notes' column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'notes') THEN
        ALTER TABLE public.clients ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column to clients table';
    END IF;
    
    -- Check if 'created_at' column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'created_at') THEN
        ALTER TABLE public.clients ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to clients table';
    END IF;
    
    -- Check if 'updated_at' column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'updated_at') THEN
        ALTER TABLE public.clients ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to clients table';
    END IF;
END $$;

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers safely (drop first if they exist)
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON public.clients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop first if they exist)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.clients;
CREATE POLICY "Enable read access for all users" ON public.clients
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON public.clients;
CREATE POLICY "Enable insert for all users" ON public.clients
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON public.clients;
CREATE POLICY "Enable update for all users" ON public.clients
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON public.clients;
CREATE POLICY "Enable delete for all users" ON public.clients
    FOR DELETE USING (true);

-- Grant permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Show final status
SELECT 'Table structure check and update completed! Check the results above to see what was found and updated.' as status; 