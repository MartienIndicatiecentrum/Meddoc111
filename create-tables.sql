-- Create clients table
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

-- Create taken table
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

-- Create logboek table
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

-- Insert sample clients
INSERT INTO public.clients (name, email, phone, city, insurance_company, status) VALUES
('Mw. P. Kroesen', 'p.kroesen@email.com', '06-12345678', 'Amsterdam', 'CZ Verzekeringen', 'active'),
('Dhr. J. van der Berg', 'j.vanderberg@email.com', '06-87654321', 'Rotterdam', 'VGZ', 'active'),
('Mw. A. de Vries', 'a.devries@email.com', '06-11223344', 'Den Haag', 'Achmea', 'active');

-- Insert sample tasks for the first client
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
UNION ALL
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
FROM public.clients c WHERE c.name = 'Mw. P. Kroesen';

-- Insert sample log entries for the first client
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
UNION ALL
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
FROM public.clients c WHERE c.name = 'Mw. P. Kroesen'; 