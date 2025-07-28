-- Simple Table Check and Creation Script
-- This script will only create tables that don't already exist

-- First, let's see what tables already exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('clients', 'Taken', 'taken', 'logboek')
ORDER BY table_name;

-- Now let's create only the missing tables

-- 1. Create clients table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    date_of_birth DATE,
    bsn_number TEXT,
    insurance_number TEXT,
    insurance_company TEXT,
    contact_person_name TEXT,
    contact_person_phone TEXT,
    contact_person_email TEXT,
    contact_person_relation TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Taken table (uppercase) if it doesn't exist
CREATE TABLE IF NOT EXISTS public."Taken" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Basic task information
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    clientennaam TEXT, -- Denormalized for performance
    
    -- Task details
    taak_type TEXT, -- Task type from dropdown
    beschrijving TEXT NOT NULL, -- Task description (required)
    status TEXT NOT NULL DEFAULT 'nieuw' CHECK (status IN ('nieuw', 'in_behandeling', 'wachten_op_info', 'opvolging', 'afgehandeld', 'geannuleerd')),
    prioriteit TEXT NOT NULL DEFAULT 'normaal' CHECK (prioriteit IN ('laag', 'normaal', 'hoog', 'urgent')),
    
    -- Dates and timing
    deadline DATE, -- Deadline for task completion
    taak_datum DATE, -- When the task should be performed
    taak_tijd TIME, -- What time the task should be performed
    geplande_datum DATE, -- Planned date (for compatibility)
    huisbezoek_datum DATE, -- Datum huisbezoek
    
    -- Notes and additional information
    notities TEXT, -- General notes
    extra_notitie TEXT, -- Extra notes for specific task types (e.g., wijzigingen_nodig)
    
    -- Insurance related fields
    verzekeraar TEXT CHECK (verzekeraar IN ('CZ', 'VGZ', 'OHRA', 'Zilveren_kruis') OR verzekeraar IS NULL),
    
    -- Document management
    upload_documenten JSONB, -- Store file references as JSON
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create taken table (lowercase) if it doesn't exist
CREATE TABLE IF NOT EXISTS public.taken (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('Hulpmiddel Aanvraag', 'PGB Aanvraag', 'WMO Herindicatie', 'Indicatie', 'Vraagstelling', 'Update', 'Notitie')),
    status TEXT NOT NULL DEFAULT 'Niet gestart' CHECK (status IN ('Niet gestart', 'In behandeling', 'Wachten op info', 'Opvolging', 'Afgerond')),
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Laag', 'Medium', 'Hoog', 'Urgent')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    deadline DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    insurer TEXT,
    external_party TEXT,
    is_urgent BOOLEAN DEFAULT FALSE,
    is_expired BOOLEAN DEFAULT FALSE,
    needs_response BOOLEAN DEFAULT FALSE
);

-- 4. Create logboek table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.logboek (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    from_name TEXT NOT NULL,
    from_type TEXT NOT NULL CHECK (from_type IN ('client', 'employee', 'insurer', 'family')),
    from_color TEXT DEFAULT 'bg-gray-500',
    type TEXT NOT NULL CHECK (type IN ('Vraag', 'Antwoord', 'Update', 'Notitie')),
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Afgehandeld' CHECK (status IN ('Urgent', 'Reactie nodig', 'Afgehandeld', 'In behandeling')),
    is_urgent BOOLEAN DEFAULT FALSE,
    needs_response BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes safely
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at);

CREATE INDEX IF NOT EXISTS idx_taken_client_id ON public."Taken"(client_id);
CREATE INDEX IF NOT EXISTS idx_taken_status ON public."Taken"(status);
CREATE INDEX IF NOT EXISTS idx_taken_prioriteit ON public."Taken"(prioriteit);
CREATE INDEX IF NOT EXISTS idx_taken_deadline ON public."Taken"(deadline);
CREATE INDEX IF NOT EXISTS idx_taken_taak_datum ON public."Taken"(taak_datum);
CREATE INDEX IF NOT EXISTS idx_taken_created_at ON public."Taken"(created_at);

CREATE INDEX IF NOT EXISTS idx_taken_lower_client_id ON public.taken(client_id);
CREATE INDEX IF NOT EXISTS idx_taken_lower_status ON public.taken(status);
CREATE INDEX IF NOT EXISTS idx_taken_lower_priority ON public.taken(priority);
CREATE INDEX IF NOT EXISTS idx_taken_lower_deadline ON public.taken(deadline);
CREATE INDEX IF NOT EXISTS idx_taken_lower_is_urgent ON public.taken(is_urgent);
CREATE INDEX IF NOT EXISTS idx_taken_lower_is_expired ON public.taken(is_expired);

CREATE INDEX IF NOT EXISTS idx_logboek_client_id ON public.logboek(client_id);
CREATE INDEX IF NOT EXISTS idx_logboek_date ON public.logboek(date);
CREATE INDEX IF NOT EXISTS idx_logboek_from_type ON public.logboek(from_type);
CREATE INDEX IF NOT EXISTS idx_logboek_type ON public.logboek(type);
CREATE INDEX IF NOT EXISTS idx_logboek_status ON public.logboek(status);

-- 6. Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create triggers safely (drop first if they exist)
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON public.clients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_taken_updated_at ON public."Taken";
CREATE TRIGGER update_taken_updated_at 
    BEFORE UPDATE ON public."Taken" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_taken_lowercase_updated_at ON public.taken;
CREATE TRIGGER update_taken_lowercase_updated_at 
    BEFORE UPDATE ON public.taken 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_logboek_updated_at ON public.logboek;
CREATE TRIGGER update_logboek_updated_at 
    BEFORE UPDATE ON public.logboek 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Taken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taken ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logboek ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies (drop first if they exist)
-- Clients policies
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

-- Taken (uppercase) policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public."Taken";
CREATE POLICY "Enable read access for all users" ON public."Taken"
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON public."Taken";
CREATE POLICY "Enable insert for all users" ON public."Taken"
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON public."Taken";
CREATE POLICY "Enable update for all users" ON public."Taken"
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON public."Taken";
CREATE POLICY "Enable delete for all users" ON public."Taken"
    FOR DELETE USING (true);

-- taken (lowercase) policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.taken;
CREATE POLICY "Enable read access for all users" ON public.taken
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON public.taken;
CREATE POLICY "Enable insert for all users" ON public.taken
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON public.taken;
CREATE POLICY "Enable update for all users" ON public.taken
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON public.taken;
CREATE POLICY "Enable delete for all users" ON public.taken
    FOR DELETE USING (true);

-- Logboek policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.logboek;
CREATE POLICY "Enable read access for all users" ON public.logboek
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON public.logboek;
CREATE POLICY "Enable insert for all users" ON public.logboek
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON public.logboek;
CREATE POLICY "Enable update for all users" ON public.logboek
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON public.logboek;
CREATE POLICY "Enable delete for all users" ON public.logboek
    FOR DELETE USING (true);

-- 10. Grant permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 11. Show final status
SELECT 'All tables created successfully! Check the results above to see what was created.' as status; 