-- Supabase Configuration Script voor Anonieme Gebruikers
-- Voor volledig functioneel factuur upload systeem

-- =====================================================
-- 1. STORAGE BUCKET SETUP
-- =====================================================

-- Factuur bucket is al aangemaakt door gebruiker
-- Configureer bucket settings (indien nodig)
UPDATE storage.buckets 
SET 
    public = true,
    file_size_limit = 52428800, -- 50MB limit
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
WHERE id = 'factuur';

-- =====================================================
-- 2. STORAGE POLICIES VOOR ANONIEME GEBRUIKERS
-- =====================================================

-- Policy: Anonieme gebruikers kunnen bestanden uploaden
CREATE POLICY "Anonymous users can upload files" ON storage.objects
    FOR INSERT 
    WITH CHECK (bucket_id = 'factuur');

-- Policy: Anonieme gebruikers kunnen bestanden lezen
CREATE POLICY "Anonymous users can view files" ON storage.objects
    FOR SELECT 
    USING (bucket_id = 'factuur');

-- Policy: Anonieme gebruikers kunnen bestanden updaten
CREATE POLICY "Anonymous users can update files" ON storage.objects
    FOR UPDATE 
    USING (bucket_id = 'factuur')
    WITH CHECK (bucket_id = 'factuur');

-- Policy: Anonieme gebruikers kunnen bestanden verwijderen
CREATE POLICY "Anonymous users can delete files" ON storage.objects
    FOR DELETE 
    USING (bucket_id = 'factuur');

-- =====================================================
-- 3. CLIENTFACTUUR TABEL POLICIES VOOR ANONIEME GEBRUIKERS
-- =====================================================

-- Verwijder bestaande restrictieve policies
DROP POLICY IF EXISTS "Users can view their own invoices" ON clientfactuur;
DROP POLICY IF EXISTS "Users can create invoices" ON clientfactuur;
DROP POLICY IF EXISTS "Users can update their own invoices" ON clientfactuur;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON clientfactuur;

-- Policy: Anonieme gebruikers kunnen alle facturen bekijken
CREATE POLICY "Anonymous users can view all invoices" ON clientfactuur
    FOR SELECT 
    USING (true);

-- Policy: Anonieme gebruikers kunnen facturen aanmaken
CREATE POLICY "Anonymous users can create invoices" ON clientfactuur
    FOR INSERT 
    WITH CHECK (true);

-- Policy: Anonieme gebruikers kunnen facturen updaten
CREATE POLICY "Anonymous users can update invoices" ON clientfactuur
    FOR UPDATE 
    USING (true)
    WITH CHECK (true);

-- Policy: Anonieme gebruikers kunnen facturen verwijderen
CREATE POLICY "Anonymous users can delete invoices" ON clientfactuur
    FOR DELETE 
    USING (true);

-- =====================================================
-- 4. FACTUUR_CLIENTS JUNCTION TABEL POLICIES
-- =====================================================

-- Verwijder bestaande restrictieve policies
DROP POLICY IF EXISTS "Users can view their own invoice-client links" ON factuur_clients;
DROP POLICY IF EXISTS "Users can create invoice-client links" ON factuur_clients;
DROP POLICY IF EXISTS "Users can update their own invoice-client links" ON factuur_clients;
DROP POLICY IF EXISTS "Users can delete their own invoice-client links" ON factuur_clients;

-- Policy: Anonieme gebruikers kunnen alle factuur-client koppelingen bekijken
CREATE POLICY "Anonymous users can view invoice-client links" ON factuur_clients
    FOR SELECT 
    USING (true);

-- Policy: Anonieme gebruikers kunnen factuur-client koppelingen aanmaken
CREATE POLICY "Anonymous users can create invoice-client links" ON factuur_clients
    FOR INSERT 
    WITH CHECK (true);

-- Policy: Anonieme gebruikers kunnen factuur-client koppelingen updaten
CREATE POLICY "Anonymous users can update invoice-client links" ON factuur_clients
    FOR UPDATE 
    USING (true)
    WITH CHECK (true);

-- Policy: Anonieme gebruikers kunnen factuur-client koppelingen verwijderen
CREATE POLICY "Anonymous users can delete invoice-client links" ON factuur_clients
    FOR DELETE 
    USING (true);

-- =====================================================
-- 5. CLIENTS TABEL POLICIES (als deze bestaat)
-- =====================================================

-- Policy: Anonieme gebruikers kunnen alle clients bekijken
CREATE POLICY "Anonymous users can view all clients" ON clients
    FOR SELECT 
    USING (true);

-- Policy: Anonieme gebruikers kunnen clients aanmaken
CREATE POLICY "Anonymous users can create clients" ON clients
    FOR INSERT 
    WITH CHECK (true);

-- Policy: Anonieme gebruikers kunnen clients updaten
CREATE POLICY "Anonymous users can update clients" ON clients
    FOR UPDATE 
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- 6. DOCUMENTS TABEL POLICIES (voor bestaande document systeem)
-- =====================================================

-- Policy: Anonieme gebruikers kunnen alle documenten bekijken
CREATE POLICY "Anonymous users can view all documents" ON documents
    FOR SELECT 
    USING (true);

-- Policy: Anonieme gebruikers kunnen documenten aanmaken
CREATE POLICY "Anonymous users can create documents" ON documents
    FOR INSERT 
    WITH CHECK (true);

-- Policy: Anonieme gebruikers kunnen documenten updaten
CREATE POLICY "Anonymous users can update documents" ON documents
    FOR UPDATE 
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- 7. ENABLE RLS OP ALLE TABELLEN
-- =====================================================

-- Zorg ervoor dat RLS enabled is op alle relevante tabellen
ALTER TABLE clientfactuur ENABLE ROW LEVEL SECURITY;
ALTER TABLE factuur_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. SAMPLE DATA VOOR TESTING
-- =====================================================

-- Voeg sample clients toe (als deze nog niet bestaan)
INSERT INTO clients (id, naam, telefoon, email, adres) VALUES 
(
    gen_random_uuid(),
    'A. Arkojan Arakelyan',
    '+31 6 12345678',
    'a.arakelyan@email.com',
    'Hoofdstraat 123, 1234 AB Amsterdam'
),
(
    gen_random_uuid(),
    'M.J. van Langbroek',
    '+31 6 87654321',
    'm.langbroek@email.com',
    'Kerkstraat 456, 5678 CD Rotterdam'
),
(
    gen_random_uuid(),
    'B. de Vries',
    '+31 6 11223344',
    'b.devries@email.com',
    'Marktplein 789, 9012 EF Utrecht'
)
ON CONFLICT (naam) DO NOTHING;

-- Voeg sample factuur toe voor testing
INSERT INTO clientfactuur (
    factuurnummer,
    client_naam,
    opdrachtgever,
    bedrag,
    datum_verstuur,
    datum_betaald,
    status,
    beschrijving,
    notities
) VALUES (
    'FAC-2024-SAMPLE',
    'Test Client',
    'Particulier',
    150.00,
    CURRENT_DATE - INTERVAL '7 days',
    NULL,
    'verzonden',
    'Sample factuur voor testing',
    'Dit is een test factuur'
)
ON CONFLICT (factuurnummer) DO NOTHING;

-- =====================================================
-- 9. VERIFICATIE QUERIES
-- =====================================================

-- Test query om te controleren of alles werkt
SELECT 
    'Storage Bucket' as component,
    CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'factuur') 
         THEN '✅ OK' 
         ELSE '❌ MISSING' 
    END as status
UNION ALL
SELECT 
    'ClientFactuur Table' as component,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clientfactuur') 
         THEN '✅ OK' 
         ELSE '❌ MISSING' 
    END as status
UNION ALL
SELECT 
    'Clients Table' as component,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') 
         THEN '✅ OK' 
         ELSE '❌ MISSING' 
    END as status
UNION ALL
SELECT 
    'Sample Data' as component,
    CASE WHEN EXISTS (SELECT 1 FROM clientfactuur WHERE factuurnummer = 'FAC-2024-SAMPLE') 
         THEN '✅ OK' 
         ELSE '❌ MISSING' 
    END as status;

-- =====================================================
-- 10. COMMENTS VOOR DOCUMENTATIE
-- =====================================================

COMMENT ON POLICY "Anonymous users can upload files" ON storage.objects IS 'Allows anonymous users to upload files to documents bucket';
COMMENT ON POLICY "Anonymous users can view all invoices" ON clientfactuur IS 'Allows anonymous users to view all invoices for demo/development purposes';
COMMENT ON POLICY "Anonymous users can create invoices" ON clientfactuur IS 'Allows anonymous users to create new invoices via upload modal';

-- =====================================================
-- INSTRUCTIES VOOR GEBRUIK:
-- =====================================================

/*
STAP 1: Voer dit complete script uit in je Supabase SQL Editor

STAP 2: Controleer of de verificatie queries allemaal ✅ OK tonen

STAP 3: Test de upload functionaliteit in je applicatie

STAP 4: Als er problemen zijn, controleer de Supabase logs:
- Ga naar Dashboard > Settings > API
- Controleer de logs voor errors

BELANGRIJK: 
- Deze configuratie is voor development/demo doeleinden
- Voor productie gebruik authenticatie en restrictievere policies
- Alle anonieme gebruikers kunnen nu alle data zien en bewerken
*/
