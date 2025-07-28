-- Safe Table Creation Script (FIXED VERSION)
-- This script checks if tables exist before creating them
-- If tables exist, it does nothing. If they don't exist, it creates them.

-- Function to check if a table exists (FIXED - no ambiguous column reference)
CREATE OR REPLACE FUNCTION table_exists(check_table_name text) 
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = check_table_name
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check if a trigger exists
CREATE OR REPLACE FUNCTION trigger_exists(check_trigger_name text) 
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT FROM pg_trigger 
        WHERE tgname = check_trigger_name
    );
END;
$$ LANGUAGE plpgsql;

-- 1. Check and create clients table if it doesn't exist
DO $$ 
BEGIN
    IF NOT table_exists('clients') THEN
        CREATE TABLE public.clients (
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
        
        -- Create indexes for clients
        CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
        CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
        CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at);
        
        RAISE NOTICE 'Created clients table';
    ELSE
        RAISE NOTICE 'clients table already exists';
    END IF;
END $$;

-- 2. Check and create Taken table if it doesn't exist
DO $$ 
BEGIN
    IF NOT table_exists('Taken') THEN
        CREATE TABLE public.Taken (
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
        
        -- Create indexes for Taken
        CREATE INDEX IF NOT EXISTS idx_taken_client_id ON public.Taken(client_id);
        CREATE INDEX IF NOT EXISTS idx_taken_status ON public.Taken(status);
        CREATE INDEX IF NOT EXISTS idx_taken_prioriteit ON public.Taken(prioriteit);
        CREATE INDEX IF NOT EXISTS idx_taken_deadline ON public.Taken(deadline);
        CREATE INDEX IF NOT EXISTS idx_taken_taak_datum ON public.Taken(taak_datum);
        CREATE INDEX IF NOT EXISTS idx_taken_created_at ON public.Taken(created_at);
        
        RAISE NOTICE 'Created Taken table';
    ELSE
        RAISE NOTICE 'Taken table already exists';
    END IF;
END $$;

-- 3. Check and create taken table (lowercase) if it doesn't exist
DO $$ 
BEGIN
    IF NOT table_exists('taken') THEN
        CREATE TABLE public.taken (
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
        
        -- Create indexes for taken
        CREATE INDEX IF NOT EXISTS idx_taken_client_id_lower ON public.taken(client_id);
        CREATE INDEX IF NOT EXISTS idx_taken_status_lower ON public.taken(status);
        CREATE INDEX IF NOT EXISTS idx_taken_priority ON public.taken(priority);
        CREATE INDEX IF NOT EXISTS idx_taken_deadline_lower ON public.taken(deadline);
        CREATE INDEX IF NOT EXISTS idx_taken_is_urgent ON public.taken(is_urgent);
        CREATE INDEX IF NOT EXISTS idx_taken_is_expired ON public.taken(is_expired);
        
        RAISE NOTICE 'Created taken table (lowercase)';
    ELSE
        RAISE NOTICE 'taken table (lowercase) already exists';
    END IF;
END $$;

-- 4. Check and create logboek table if it doesn't exist
DO $$ 
BEGIN
    IF NOT table_exists('logboek') THEN
        CREATE TABLE public.logboek (
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
        
        -- Create indexes for logboek
        CREATE INDEX IF NOT EXISTS idx_logboek_client_id ON public.logboek(client_id);
        CREATE INDEX IF NOT EXISTS idx_logboek_date ON public.logboek(date);
        CREATE INDEX IF NOT EXISTS idx_logboek_from_type ON public.logboek(from_type);
        CREATE INDEX IF NOT EXISTS idx_logboek_type ON public.logboek(type);
        CREATE INDEX IF NOT EXISTS idx_logboek_status ON public.logboek(status);
        
        RAISE NOTICE 'Created logboek table';
    ELSE
        RAISE NOTICE 'logboek table already exists';
    END IF;
END $$;

-- 5. Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Create triggers safely (only if they don't exist)
DO $$ 
BEGIN
    -- Clients table trigger
    IF NOT trigger_exists('update_clients_updated_at') THEN
        CREATE TRIGGER update_clients_updated_at 
            BEFORE UPDATE ON public.clients 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created update_clients_updated_at trigger';
    ELSE
        RAISE NOTICE 'update_clients_updated_at trigger already exists';
    END IF;

    -- Taken table trigger (uppercase)
    IF NOT trigger_exists('update_taken_updated_at') THEN
        CREATE TRIGGER update_taken_updated_at 
            BEFORE UPDATE ON public.Taken 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created update_taken_updated_at trigger (uppercase)';
    ELSE
        RAISE NOTICE 'update_taken_updated_at trigger (uppercase) already exists';
    END IF;

    -- taken table trigger (lowercase)
    IF NOT trigger_exists('update_taken_lowercase_updated_at') THEN
        CREATE TRIGGER update_taken_lowercase_updated_at 
            BEFORE UPDATE ON public.taken 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created update_taken_lowercase_updated_at trigger';
    ELSE
        RAISE NOTICE 'update_taken_lowercase_updated_at trigger already exists';
    END IF;

    -- Logboek table trigger
    IF NOT trigger_exists('update_logboek_updated_at') THEN
        CREATE TRIGGER update_logboek_updated_at 
            BEFORE UPDATE ON public.logboek 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created update_logboek_updated_at trigger';
    ELSE
        RAISE NOTICE 'update_logboek_updated_at trigger already exists';
    END IF;
END $$;

-- 7. Enable Row Level Security (RLS) on all tables
DO $$ 
BEGIN
    -- Enable RLS on clients
    IF table_exists('clients') THEN
        ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies for clients (only if they don't exist)
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Enable read access for all users') THEN
            CREATE POLICY "Enable read access for all users" ON public.clients
                FOR SELECT USING (true);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Enable insert for all users') THEN
            CREATE POLICY "Enable insert for all users" ON public.clients
                FOR INSERT WITH CHECK (true);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Enable update for all users') THEN
            CREATE POLICY "Enable update for all users" ON public.clients
                FOR UPDATE USING (true);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Enable delete for all users') THEN
            CREATE POLICY "Enable delete for all users" ON public.clients
                FOR DELETE USING (true);
        END IF;
    END IF;

    -- Enable RLS on Taken (uppercase)
    IF table_exists('Taken') THEN
        ALTER TABLE public.Taken ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies for Taken
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Taken' AND policyname = 'Enable read access for all users') THEN
            CREATE POLICY "Enable read access for all users" ON public.Taken
                FOR SELECT USING (true);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Taken' AND policyname = 'Enable insert for all users') THEN
            CREATE POLICY "Enable insert for all users" ON public.Taken
                FOR INSERT WITH CHECK (true);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Taken' AND policyname = 'Enable update for all users') THEN
            CREATE POLICY "Enable update for all users" ON public.Taken
                FOR UPDATE USING (true);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Taken' AND policyname = 'Enable delete for all users') THEN
            CREATE POLICY "Enable delete for all users" ON public.Taken
                FOR DELETE USING (true);
        END IF;
    END IF;

    -- Enable RLS on taken (lowercase)
    IF table_exists('taken') THEN
        ALTER TABLE public.taken ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies for taken
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'taken' AND policyname = 'Enable read access for all users') THEN
            CREATE POLICY "Enable read access for all users" ON public.taken
                FOR SELECT USING (true);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'taken' AND policyname = 'Enable insert for all users') THEN
            CREATE POLICY "Enable insert for all users" ON public.taken
                FOR INSERT WITH CHECK (true);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'taken' AND policyname = 'Enable update for all users') THEN
            CREATE POLICY "Enable update for all users" ON public.taken
                FOR UPDATE USING (true);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'taken' AND policyname = 'Enable delete for all users') THEN
            CREATE POLICY "Enable delete for all users" ON public.taken
                FOR DELETE USING (true);
        END IF;
    END IF;

    -- Enable RLS on logboek
    IF table_exists('logboek') THEN
        ALTER TABLE public.logboek ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies for logboek
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logboek' AND policyname = 'Enable read access for all users') THEN
            CREATE POLICY "Enable read access for all users" ON public.logboek
                FOR SELECT USING (true);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logboek' AND policyname = 'Enable insert for all users') THEN
            CREATE POLICY "Enable insert for all users" ON public.logboek
                FOR INSERT WITH CHECK (true);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logboek' AND policyname = 'Enable update for all users') THEN
            CREATE POLICY "Enable update for all users" ON public.logboek
                FOR UPDATE USING (true);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logboek' AND policyname = 'Enable delete for all users') THEN
            CREATE POLICY "Enable delete for all users" ON public.logboek
                FOR DELETE USING (true);
        END IF;
    END IF;
END $$;

-- 8. Add comments for documentation
DO $$ 
BEGIN
    IF table_exists('Taken') THEN
        COMMENT ON TABLE public.Taken IS 'Enhanced task management table with support for dates, times, insurance info, and document uploads';
        COMMENT ON COLUMN public.Taken.taak_type IS 'Type of task from dropdown (indicatie, vraagstelling, etc.)';
        COMMENT ON COLUMN public.Taken.taak_datum IS 'Date when the task should be performed';
        COMMENT ON COLUMN public.Taken.taak_tijd IS 'Time when the task should be performed';
        COMMENT ON COLUMN public.Taken.extra_notitie IS 'Additional notes for specific task types (e.g., changes needed)';
        COMMENT ON COLUMN public.Taken.verzekeraar IS 'Insurance company for insurance-related tasks';
        COMMENT ON COLUMN public.Taken.upload_documenten IS 'JSON array of uploaded document references';
    END IF;
END $$;

-- 9. Clean up helper functions
DROP FUNCTION IF EXISTS table_exists(text);
DROP FUNCTION IF EXISTS trigger_exists(text);

-- 10. Grant permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success message
SELECT 'Safe table creation completed successfully! All tables checked and created if needed.' as status; 