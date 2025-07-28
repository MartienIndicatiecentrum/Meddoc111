-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
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
    deleted_at TIMESTAMPTZ,
    
    -- Indexes for common queries
    INDEX idx_clients_bsn (bsn),
    INDEX idx_clients_care_status (care_status),
    INDEX idx_clients_city (city),
    INDEX idx_clients_created_at (created_at),
    INDEX idx_clients_deleted_at (deleted_at)
);

-- Create emergency contacts table
CREATE TABLE IF NOT EXISTS public.client_emergency_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create medical information table (for more detailed medical data)
CREATE TABLE IF NOT EXISTS public.client_medical_info (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    diagnoses TEXT[],
    medications TEXT[],
    allergies TEXT[],
    blood_type VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id)
);

-- Create RLS policies
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_medical_info ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users (healthcare workers)
CREATE POLICY "Healthcare workers can view all clients" ON public.clients
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Healthcare workers can insert clients" ON public.clients
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Healthcare workers can update clients" ON public.clients
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Soft delete only for clients" ON public.clients
    FOR DELETE TO authenticated USING (false);

-- Similar policies for related tables
CREATE POLICY "Healthcare workers can manage emergency contacts" ON public.client_emergency_contacts
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Healthcare workers can manage medical info" ON public.client_medical_info
    FOR ALL TO authenticated USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers (with IF NOT EXISTS check)
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
END $$;

-- Insert sample data (optional - remove in production)
INSERT INTO public.clients (
    bsn, first_name, last_name, date_of_birth, gender,
    phone, email, preferred_contact_method,
    street, house_number, house_number_addition, postal_code, city,
    care_status, care_level, care_start_date, care_coordinator,
    insurance_company, insurance_policy_number, insurance_valid_until,
    primary_diagnosis, mobility, cognitive_status,
    notes, tags
) VALUES
    ('123456789', 'Jan', 'de Vries', '1945-03-15', 'male',
     '06-12345678', 'jan.devries@email.nl', 'phone',
     'Hoofdstraat', '123', 'A', '1234 AB', 'Amsterdam',
     'active_care', 'wlz_3', '2023-01-15', 'Maria Jansen',
     'Zilveren Kruis', 'ZK123456', '2024-12-31',
     ARRAY['Dementie', 'Diabetes Type 2'], 'Rollator', 'Licht dementerend',
     'Cliënt heeft moeite met nieuwe gezichten. Graag vaste zorgverleners inzetten.',
     ARRAY['Dementie', 'Valrisico', 'Diabetes']),
    ('987654321', 'Maria', 'Bakker', '1950-07-22', 'female',
     '06-98765432', 'maria.bakker@email.nl', 'email',
     'Kerkstraat', '45', NULL, '5678 CD', 'Utrecht',
     'active_care', 'wlz_2', '2023-06-01', 'Linda Peters',
     'CZ', 'CZ789012', '2024-12-31',
     ARRAY['Artrose', 'COPD'], 'Zelfstandig', 'Helder',
     'Cliënt is zeer zelfstandig en wil graag betrokken blijven bij haar zorgplan.',
     ARRAY['COPD', 'Zelfstandig']),
    ('456789123', 'Henk', 'Jansen', '1948-11-30', 'male',
     '06-33445566', NULL, 'phone',
     'Dorpsplein', '8', NULL, '9012 EF', 'Groningen',
     'assessment_phase', 'wmo', '2024-01-01', 'Johan de Wit',
     'Menzis', 'MZ345678', '2024-12-31',
     ARRAY['Hartfalen'], 'Beperkt', 'Helder',
     'Recent opgenomen geweest voor hartfalen. Heeft ondersteuning nodig bij ADL.',
     ARRAY['Hartpatiënt', 'Nieuwe cliënt']);

-- Add emergency contacts for sample clients
INSERT INTO public.client_emergency_contacts (client_id, name, relationship, phone, is_primary)
SELECT 
    c.id, 
    'Anna de Vries', 
    'Dochter', 
    '06-87654321', 
    true
FROM public.clients c WHERE c.bsn = '123456789';

INSERT INTO public.client_emergency_contacts (client_id, name, relationship, phone, is_primary)
SELECT 
    c.id, 
    'Peter Bakker', 
    'Zoon', 
    '06-55443322', 
    true
FROM public.clients c WHERE c.bsn = '987654321';