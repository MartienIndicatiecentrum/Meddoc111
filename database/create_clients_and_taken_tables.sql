-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Basic client information
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    
    -- Additional information
    date_of_birth DATE,
    bsn_number TEXT, -- Dutch social security number
    insurance_number TEXT,
    insurance_company TEXT,
    
    -- Contact person
    contact_person_name TEXT,
    contact_person_phone TEXT,
    contact_person_email TEXT,
    contact_person_relation TEXT, -- e.g., "Family", "Guardian", etc.
    
    -- Status and notes
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Taken table for lopende zaken (ongoing processes)
CREATE TABLE IF NOT EXISTS public.taken (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Basic task information
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    
    -- Task details
    type TEXT NOT NULL CHECK (type IN ('Hulpmiddel Aanvraag', 'PGB Aanvraag', 'WMO Herindicatie', 'Indicatie', 'Vraagstelling', 'Update', 'Notitie')),
    status TEXT NOT NULL DEFAULT 'Niet gestart' CHECK (status IN ('Niet gestart', 'In behandeling', 'Wachten op info', 'Opvolging', 'Afgerond')),
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Laag', 'Medium', 'Hoog', 'Urgent')),
    
    -- Progress tracking
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    
    -- Dates and timing
    deadline DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Insurance and external parties
    insurer TEXT,
    external_party TEXT,
    
    -- Flags
    is_urgent BOOLEAN DEFAULT FALSE,
    is_expired BOOLEAN DEFAULT FALSE,
    needs_response BOOLEAN DEFAULT FALSE
);

-- Create logboek table for communication log
CREATE TABLE IF NOT EXISTS public.logboek (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Reference to client
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    
    -- Entry details
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    from_name TEXT NOT NULL,
    from_type TEXT NOT NULL CHECK (from_type IN ('client', 'employee', 'insurer', 'family')),
    from_color TEXT DEFAULT 'bg-gray-500', -- CSS color class
    
    -- Message details
    type TEXT NOT NULL CHECK (type IN ('Vraag', 'Antwoord', 'Update', 'Notitie')),
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'Afgehandeld' CHECK (status IN ('Urgent', 'Reactie nodig', 'Afgehandeld', 'In behandeling')),
    is_urgent BOOLEAN DEFAULT FALSE,
    needs_response BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at);

CREATE INDEX IF NOT EXISTS idx_taken_client_id ON public.taken(client_id);
CREATE INDEX IF NOT EXISTS idx_taken_status ON public.taken(status);
CREATE INDEX IF NOT EXISTS idx_taken_priority ON public.taken(priority);
CREATE INDEX IF NOT EXISTS idx_taken_deadline ON public.taken(deadline);
CREATE INDEX IF NOT EXISTS idx_taken_is_urgent ON public.taken(is_urgent);
CREATE INDEX IF NOT EXISTS idx_taken_is_expired ON public.taken(is_expired);

CREATE INDEX IF NOT EXISTS idx_logboek_client_id ON public.logboek(client_id);
CREATE INDEX IF NOT EXISTS idx_logboek_date ON public.logboek(date);
CREATE INDEX IF NOT EXISTS idx_logboek_from_type ON public.logboek(from_type);
CREATE INDEX IF NOT EXISTS idx_logboek_type ON public.logboek(type);
CREATE INDEX IF NOT EXISTS idx_logboek_status ON public.logboek(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (with IF NOT EXISTS check)
DO $$ 
BEGIN
    -- Clients table
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_clients_updated_at') THEN
        CREATE TRIGGER update_clients_updated_at 
            BEFORE UPDATE ON public.clients 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Taken table
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_taken_updated_at') THEN
        CREATE TRIGGER update_taken_updated_at 
            BEFORE UPDATE ON public.taken 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Logboek table
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_logboek_updated_at') THEN
        CREATE TRIGGER update_logboek_updated_at 
            BEFORE UPDATE ON public.logboek 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Enable Row Level Security (RLS)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taken ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logboek ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clients
CREATE POLICY "Enable read access for all users" ON public.clients
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.clients
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.clients
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.clients
    FOR DELETE USING (true);

-- Create RLS policies for taken
CREATE POLICY "Enable read access for all users" ON public.taken
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.taken
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.taken
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.taken
    FOR DELETE USING (true);

-- Create RLS policies for logboek
CREATE POLICY "Enable read access for all users" ON public.logboek
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.logboek
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.logboek
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.logboek
    FOR DELETE USING (true);

-- Insert sample data for testing
INSERT INTO public.clients (name, email, phone, city, insurance_company, status) VALUES
('Mw. P. Kroesen', 'p.kroesen@email.com', '06-12345678', 'Amsterdam', 'CZ Verzekeringen', 'active'),
('Dhr. J. van der Berg', 'j.vanderberg@email.com', '06-87654321', 'Rotterdam', 'VGZ', 'active'),
('Mw. A. de Vries', 'a.devries@email.com', '06-11223344', 'Den Haag', 'Achmea', 'active'),
('Dhr. M. Bakker', 'm.bakker@email.com', '06-55667788', 'Utrecht', 'Zilveren Kruis', 'active'),
('Mw. S. Jansen', 's.jansen@email.com', '06-99887766', 'Eindhoven', 'OHRA', 'active')
ON CONFLICT DO NOTHING;

-- Insert sample taken data
INSERT INTO public.taken (client_id, title, description, type, status, priority, progress, deadline, insurer, is_urgent, is_expired, needs_response) 
SELECT 
    c.id,
    'Aanvraag rolstoel voor cliënt',
    'Rolstoel aanvraag voor dagelijks gebruik',
    'Hulpmiddel Aanvraag',
    'Niet gestart',
    'Urgent',
    10,
    '2024-01-25',
    'Achmea',
    true,
    true,
    true
FROM public.clients c WHERE c.name = 'Mw. P. Kroesen'
ON CONFLICT DO NOTHING;

INSERT INTO public.taken (client_id, title, description, type, status, priority, progress, deadline, insurer, is_urgent, is_expired, needs_response) 
SELECT 
    c.id,
    'PGB aanvraag nieuwe indicatie',
    'Nieuwe PGB indicatie voor thuiszorg',
    'PGB Aanvraag',
    'In behandeling',
    'Hoog',
    65,
    '2024-02-15',
    'CZ Verzekeringen',
    true,
    true,
    false
FROM public.clients c WHERE c.name = 'Mw. P. Kroesen'
ON CONFLICT DO NOTHING;

INSERT INTO public.taken (client_id, title, description, type, status, priority, progress, deadline, insurer, is_urgent, is_expired, needs_response) 
SELECT 
    c.id,
    'WMO herindicatie traject',
    'Herindicatie voor WMO voorzieningen',
    'WMO Herindicatie',
    'Wachten op info',
    'Medium',
    30,
    '2024-02-20',
    'VGZ',
    false,
    true,
    true
FROM public.clients c WHERE c.name = 'Mw. P. Kroesen'
ON CONFLICT DO NOTHING;

-- Insert sample logboek data
INSERT INTO public.logboek (client_id, from_name, from_type, from_color, type, action, description, status, is_urgent, needs_response)
SELECT 
    c.id,
    'Mw. P. Kroesen',
    'client',
    'bg-blue-500',
    'Vraag',
    'Vraag gesteld',
    'Wanneer kan ik verwachten dat de indicatie wordt goedgekeurd? Ik heb dringend zorg nodig.',
    'Reactie nodig',
    true,
    true
FROM public.clients c WHERE c.name = 'Mw. P. Kroesen'
ON CONFLICT DO NOTHING;

INSERT INTO public.logboek (client_id, from_name, from_type, from_color, type, action, description, status, is_urgent, needs_response)
SELECT 
    c.id,
    'Sarah (Medewerker)',
    'employee',
    'bg-gray-500',
    'Antwoord',
    'Antwoord gegeven',
    'Ik heb uw dossier bekeken. De indicatie wordt momenteel beoordeeld door de verzekeraar. Ik verwacht binnen 2 weken een reactie. Ik zal dit voor u opvolgen.',
    'Afgehandeld',
    false,
    false
FROM public.clients c WHERE c.name = 'Mw. P. Kroesen'
ON CONFLICT DO NOTHING;

INSERT INTO public.logboek (client_id, from_name, from_type, from_color, type, action, description, status, is_urgent, needs_response)
SELECT 
    c.id,
    'CZ Verzekeringen',
    'insurer',
    'bg-green-500',
    'Vraag',
    'Vraag gesteld',
    'Wij hebben aanvullende informatie nodig over de zorgbehoefte. Kunt u de laatste 3 maanden van de zorgverlening toelichten? Dit is nodig voor de beoordeling.',
    'Reactie nodig',
    false,
    true
FROM public.clients c WHERE c.name = 'Mw. P. Kroesen'
ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE public.clients IS 'Client information table for healthcare management';
COMMENT ON TABLE public.taken IS 'Task/process management table for ongoing healthcare processes';
COMMENT ON TABLE public.logboek IS 'Communication log for tracking all client communications'; 