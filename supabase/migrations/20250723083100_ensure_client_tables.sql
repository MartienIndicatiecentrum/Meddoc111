-- Migration: Ensure all client-related tables exist
-- This script checks for existing tables and only creates missing ones

-- Function to check if a table exists
CREATE OR REPLACE FUNCTION table_exists(table_name text) 
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
    );
END;
$$ LANGUAGE plpgsql;

-- 1. Check and create clients table if it doesn't exist
DO $$ 
BEGIN
    IF NOT table_exists('clients') THEN
        CREATE TABLE public.clients (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            bsn VARCHAR(9) UNIQUE NOT NULL,
            first_name VARCHAR(255) NOT NULL,
            last_name VARCHAR(255) NOT NULL,
            full_name VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
            date_of_birth DATE NOT NULL,
            age INTEGER GENERATED ALWAYS AS (DATE_PART('year', AGE(date_of_birth))::INTEGER) STORED,
            gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other')),
            
            -- Contact information
            phone VARCHAR(20),
            email VARCHAR(255),
            preferred_contact_method VARCHAR(20) CHECK (preferred_contact_method IN ('phone', 'email', 'sms', 'whatsapp')),
            
            -- Address
            street VARCHAR(255),
            house_number VARCHAR(10),
            house_number_addition VARCHAR(10),
            postal_code VARCHAR(10),
            city VARCHAR(255),
            country VARCHAR(100) DEFAULT 'Nederland',
            
            -- Care information
            care_status VARCHAR(50) CHECK (care_status IN ('intake_pending', 'assessment_phase', 'care_planning', 'active_care', 'care_suspended', 'care_ended', 'transferred')),
            care_level VARCHAR(20) CHECK (care_level IN ('wlz_1', 'wlz_2', 'wlz_3', 'wlz_4', 'wlz_5', 'wmo', 'zvw')),
            care_start_date DATE,
            care_end_date DATE,
            care_coordinator VARCHAR(255),
            
            -- Insurance
            insurance_company VARCHAR(255),
            insurance_policy_number VARCHAR(50),
            insurance_valid_until DATE,
            
            -- Medical (basic - sensitive data should be encrypted)
            primary_diagnosis TEXT[],
            mobility VARCHAR(100),
            cognitive_status VARCHAR(100),
            
            -- Other
            notes TEXT,
            tags TEXT[],
            profile_photo_url TEXT,
            
            -- Metadata
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            created_by UUID REFERENCES auth.users(id),
            updated_by UUID REFERENCES auth.users(id),
            deleted_at TIMESTAMPTZ
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_clients_bsn ON public.clients(bsn);
        CREATE INDEX IF NOT EXISTS idx_clients_care_status ON public.clients(care_status);
        CREATE INDEX IF NOT EXISTS idx_clients_city ON public.clients(city);
        CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at);
        CREATE INDEX IF NOT EXISTS idx_clients_deleted_at ON public.clients(deleted_at);

        RAISE NOTICE 'Created clients table';
    ELSE
        RAISE NOTICE 'clients table already exists';
    END IF;
END $$;

-- 2. Check and create client_emergency_contacts table if it doesn't exist
DO $$ 
BEGIN
    IF NOT table_exists('client_emergency_contacts') THEN
        CREATE TABLE public.client_emergency_contacts (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            relationship VARCHAR(100),
            phone VARCHAR(20) NOT NULL,
            email VARCHAR(255),
            is_primary BOOLEAN DEFAULT FALSE,
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            created_by UUID REFERENCES auth.users(id),
            updated_by UUID REFERENCES auth.users(id)
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_emergency_contacts_client_id ON public.client_emergency_contacts(client_id);
        CREATE INDEX IF NOT EXISTS idx_emergency_contacts_is_primary ON public.client_emergency_contacts(is_primary);

        RAISE NOTICE 'Created client_emergency_contacts table';
    ELSE
        RAISE NOTICE 'client_emergency_contacts table already exists';
    END IF;
END $$;

-- 3. Check and create client_medical_info table if it doesn't exist
DO $$ 
BEGIN
    IF NOT table_exists('client_medical_info') THEN
        CREATE TABLE public.client_medical_info (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
            diagnoses TEXT[],
            medications TEXT[],
            allergies TEXT[],
            blood_type VARCHAR(10),
            dietary_restrictions TEXT[],
            medical_devices TEXT[], -- wheelchair, hearing aid, etc.
            fall_risk BOOLEAN DEFAULT FALSE,
            infection_risk BOOLEAN DEFAULT FALSE,
            dnr_status BOOLEAN DEFAULT FALSE,
            additional_notes TEXT,
            last_hospital_admission DATE,
            treating_physician VARCHAR(255),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            created_by UUID REFERENCES auth.users(id),
            updated_by UUID REFERENCES auth.users(id),
            UNIQUE(client_id)
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_medical_info_client_id ON public.client_medical_info(client_id);

        RAISE NOTICE 'Created client_medical_info table';
    ELSE
        RAISE NOTICE 'client_medical_info table already exists';
    END IF;
END $$;

-- 4. Check and create client_care_plans table if it doesn't exist
DO $$ 
BEGIN
    IF NOT table_exists('client_care_plans') THEN
        CREATE TABLE public.client_care_plans (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
            plan_type VARCHAR(50) CHECK (plan_type IN ('initial', 'periodic', 'incident', 'discharge')),
            status VARCHAR(50) CHECK (status IN ('draft', 'active', 'review', 'archived')),
            start_date DATE NOT NULL,
            end_date DATE,
            goals TEXT[],
            interventions JSONB, -- Structured data for care interventions
            evaluation_date DATE,
            evaluation_notes TEXT,
            approved_by VARCHAR(255),
            approved_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            created_by UUID REFERENCES auth.users(id),
            updated_by UUID REFERENCES auth.users(id)
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_care_plans_client_id ON public.client_care_plans(client_id);
        CREATE INDEX IF NOT EXISTS idx_care_plans_status ON public.client_care_plans(status);
        CREATE INDEX IF NOT EXISTS idx_care_plans_start_date ON public.client_care_plans(start_date);

        RAISE NOTICE 'Created client_care_plans table';
    ELSE
        RAISE NOTICE 'client_care_plans table already exists';
    END IF;
END $$;

-- 5. Check and create client_documents table if it doesn't exist
DO $$ 
BEGIN
    IF NOT table_exists('client_documents') THEN
        CREATE TABLE public.client_documents (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
            document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
            document_type VARCHAR(50) CHECK (document_type IN ('intake', 'assessment', 'care_plan', 'medical', 'consent', 'insurance', 'other')),
            description TEXT,
            is_confidential BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            created_by UUID REFERENCES auth.users(id)
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_client_documents_client_id ON public.client_documents(client_id);
        CREATE INDEX IF NOT EXISTS idx_client_documents_document_id ON public.client_documents(document_id);
        CREATE INDEX IF NOT EXISTS idx_client_documents_type ON public.client_documents(document_type);

        RAISE NOTICE 'Created client_documents table';
    ELSE
        RAISE NOTICE 'client_documents table already exists';
    END IF;
END $$;

-- 6. Check and create client_tasks table if it doesn't exist
DO $$ 
BEGIN
    IF NOT table_exists('client_tasks') THEN
        CREATE TABLE public.client_tasks (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
            task_id UUID REFERENCES public.taken(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            created_by UUID REFERENCES auth.users(id),
            UNIQUE(client_id, task_id)
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_client_tasks_client_id ON public.client_tasks(client_id);
        CREATE INDEX IF NOT EXISTS idx_client_tasks_task_id ON public.client_tasks(task_id);

        RAISE NOTICE 'Created client_tasks table';
    ELSE
        RAISE NOTICE 'client_tasks table already exists';
    END IF;
END $$;

-- 7. Check and create client_notes table if it doesn't exist
DO $$ 
BEGIN
    IF NOT table_exists('client_notes') THEN
        CREATE TABLE public.client_notes (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
            note_type VARCHAR(50) CHECK (note_type IN ('general', 'medical', 'care', 'incident', 'family', 'administrative')),
            note_text TEXT NOT NULL,
            is_confidential BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            created_by UUID REFERENCES auth.users(id),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            updated_by UUID REFERENCES auth.users(id)
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_client_notes_client_id ON public.client_notes(client_id);
        CREATE INDEX IF NOT EXISTS idx_client_notes_type ON public.client_notes(note_type);
        CREATE INDEX IF NOT EXISTS idx_client_notes_created_at ON public.client_notes(created_at);

        RAISE NOTICE 'Created client_notes table';
    ELSE
        RAISE NOTICE 'client_notes table already exists';
    END IF;
END $$;

-- 8. Check and create client_incidents table if it doesn't exist
DO $$ 
BEGIN
    IF NOT table_exists('client_incidents') THEN
        CREATE TABLE public.client_incidents (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
            incident_date TIMESTAMPTZ NOT NULL,
            incident_type VARCHAR(50) CHECK (incident_type IN ('fall', 'medication_error', 'behavioral', 'medical_emergency', 'equipment_failure', 'other')),
            severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
            description TEXT NOT NULL,
            actions_taken TEXT,
            follow_up_required BOOLEAN DEFAULT FALSE,
            follow_up_notes TEXT,
            reported_to VARCHAR(255),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            created_by UUID REFERENCES auth.users(id),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            updated_by UUID REFERENCES auth.users(id)
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_client_incidents_client_id ON public.client_incidents(client_id);
        CREATE INDEX IF NOT EXISTS idx_client_incidents_date ON public.client_incidents(incident_date);
        CREATE INDEX IF NOT EXISTS idx_client_incidents_type ON public.client_incidents(incident_type);
        CREATE INDEX IF NOT EXISTS idx_client_incidents_severity ON public.client_incidents(severity);

        RAISE NOTICE 'Created client_incidents table';
    ELSE
        RAISE NOTICE 'client_incidents table already exists';
    END IF;
END $$;

-- Enable Row Level Security on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_medical_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_care_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_incidents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (if they don't exist)
DO $$ 
BEGIN
    -- Clients table policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Healthcare workers can view all clients') THEN
        CREATE POLICY "Healthcare workers can view all clients" ON public.clients
            FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Healthcare workers can insert clients') THEN
        CREATE POLICY "Healthcare workers can insert clients" ON public.clients
            FOR INSERT TO authenticated WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Healthcare workers can update clients') THEN
        CREATE POLICY "Healthcare workers can update clients" ON public.clients
            FOR UPDATE TO authenticated USING (true);
    END IF;

    -- Emergency contacts policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_emergency_contacts' AND policyname = 'Healthcare workers can manage emergency contacts') THEN
        CREATE POLICY "Healthcare workers can manage emergency contacts" ON public.client_emergency_contacts
            FOR ALL TO authenticated USING (true);
    END IF;

    -- Medical info policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_medical_info' AND policyname = 'Healthcare workers can manage medical info') THEN
        CREATE POLICY "Healthcare workers can manage medical info" ON public.client_medical_info
            FOR ALL TO authenticated USING (true);
    END IF;

    -- Care plans policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_care_plans' AND policyname = 'Healthcare workers can manage care plans') THEN
        CREATE POLICY "Healthcare workers can manage care plans" ON public.client_care_plans
            FOR ALL TO authenticated USING (true);
    END IF;

    -- Documents policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_documents' AND policyname = 'Healthcare workers can manage client documents') THEN
        CREATE POLICY "Healthcare workers can manage client documents" ON public.client_documents
            FOR ALL TO authenticated USING (true);
    END IF;

    -- Tasks policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_tasks' AND policyname = 'Healthcare workers can manage client tasks') THEN
        CREATE POLICY "Healthcare workers can manage client tasks" ON public.client_tasks
            FOR ALL TO authenticated USING (true);
    END IF;

    -- Notes policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_notes' AND policyname = 'Healthcare workers can manage client notes') THEN
        CREATE POLICY "Healthcare workers can manage client notes" ON public.client_notes
            FOR ALL TO authenticated USING (true);
    END IF;

    -- Incidents policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_incidents' AND policyname = 'Healthcare workers can manage client incidents') THEN
        CREATE POLICY "Healthcare workers can manage client incidents" ON public.client_incidents
            FOR ALL TO authenticated USING (true);
    END IF;
END $$;

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (if they don't exist)
DO $$ 
BEGIN
    -- Clients table
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_clients_updated_at') THEN
        CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Emergency contacts
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_emergency_contacts_updated_at') THEN
        CREATE TRIGGER update_emergency_contacts_updated_at BEFORE UPDATE ON public.client_emergency_contacts
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Medical info
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_medical_info_updated_at') THEN
        CREATE TRIGGER update_medical_info_updated_at BEFORE UPDATE ON public.client_medical_info
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Care plans
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_care_plans_updated_at') THEN
        CREATE TRIGGER update_care_plans_updated_at BEFORE UPDATE ON public.client_care_plans
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Notes
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_client_notes_updated_at') THEN
        CREATE TRIGGER update_client_notes_updated_at BEFORE UPDATE ON public.client_notes
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Incidents
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_client_incidents_updated_at') THEN
        CREATE TRIGGER update_client_incidents_updated_at BEFORE UPDATE ON public.client_incidents
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create views for easier data access
CREATE OR REPLACE VIEW client_overview AS
SELECT 
    c.*,
    (SELECT COUNT(*) FROM client_emergency_contacts WHERE client_id = c.id) as emergency_contact_count,
    (SELECT COUNT(*) FROM client_notes WHERE client_id = c.id) as note_count,
    (SELECT COUNT(*) FROM client_incidents WHERE client_id = c.id) as incident_count,
    (SELECT COUNT(*) FROM client_documents WHERE client_id = c.id) as document_count,
    (SELECT COUNT(*) FROM client_tasks ct JOIN taken t ON ct.task_id = t.id WHERE ct.client_id = c.id AND t.status != 'completed') as open_task_count
FROM clients c
WHERE c.deleted_at IS NULL;

-- Clean up the helper function
DROP FUNCTION IF EXISTS table_exists(text);

-- Grant permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

RAISE NOTICE 'Migration completed successfully!';