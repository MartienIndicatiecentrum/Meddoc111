-- SQL Update Script voor Multiple Client Support
-- Voor gebruik in Supabase/PostgreSQL database

-- 1. Maak een junction table voor factuur-client relaties
CREATE TABLE IF NOT EXISTS factuur_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factuur_id UUID NOT NULL,
    client_id UUID,
    client_naam VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints (uncomment when clients table exists)
    -- FOREIGN KEY (factuur_id) REFERENCES clientfactuur(id) ON DELETE CASCADE,
    -- FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    
    -- Prevent duplicate client assignments to same invoice
    UNIQUE(factuur_id, client_id)
);

-- 2. Indexen voor betere performance
CREATE INDEX IF NOT EXISTS idx_factuur_clients_factuur_id ON factuur_clients(factuur_id);
CREATE INDEX IF NOT EXISTS idx_factuur_clients_client_id ON factuur_clients(client_id);

-- 3. RLS policies voor factuur_clients tabel
ALTER TABLE factuur_clients ENABLE ROW LEVEL SECURITY;

-- Policy: Users kunnen alleen hun eigen factuur-client koppelingen zien
CREATE POLICY "Users can view their own invoice-client links" ON factuur_clients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clientfactuur cf 
            WHERE cf.id = factuur_clients.factuur_id 
            AND cf.created_by = auth.uid()
        )
    );

-- Policy: Users kunnen factuur-client koppelingen aanmaken
CREATE POLICY "Users can create invoice-client links" ON factuur_clients
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM clientfactuur cf 
            WHERE cf.id = factuur_clients.factuur_id 
            AND cf.created_by = auth.uid()
        )
    );

-- Policy: Users kunnen hun eigen factuur-client koppelingen updaten
CREATE POLICY "Users can update their own invoice-client links" ON factuur_clients
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM clientfactuur cf 
            WHERE cf.id = factuur_clients.factuur_id 
            AND cf.created_by = auth.uid()
        )
    );

-- Policy: Users kunnen hun eigen factuur-client koppelingen verwijderen
CREATE POLICY "Users can delete their own invoice-client links" ON factuur_clients
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM clientfactuur cf 
            WHERE cf.id = factuur_clients.factuur_id 
            AND cf.created_by = auth.uid()
        )
    );

-- 4. Update de status enum om 'openstaand' toe te voegen
ALTER TABLE clientfactuur 
DROP CONSTRAINT IF EXISTS clientfactuur_status_check;

ALTER TABLE clientfactuur 
ADD CONSTRAINT clientfactuur_status_check 
CHECK (status IN ('concept', 'verzonden', 'betaald', 'achterstallig', 'geannuleerd', 'openstaand'));

-- 5. Maak een view voor facturen met multiple clients
CREATE OR REPLACE VIEW factuur_met_clients AS
SELECT 
    f.id,
    f.factuurnummer,
    f.opdrachtgever,
    f.bedrag,
    f.datum_aangemaakt,
    f.datum_verstuur,
    f.datum_betaald,
    f.status,
    f.beschrijving,
    f.notities,
    f.document_urls,
    f.created_at,
    f.updated_at,
    f.created_by,
    -- Aggregate client information
    COALESCE(
        STRING_AGG(fc.client_naam, ', ' ORDER BY fc.client_naam), 
        f.client_naam
    ) as client_namen,
    ARRAY_AGG(fc.client_id ORDER BY fc.client_naam) FILTER (WHERE fc.client_id IS NOT NULL) as client_ids
FROM clientfactuur f
LEFT JOIN factuur_clients fc ON f.id = fc.factuur_id
GROUP BY f.id, f.factuurnummer, f.client_naam, f.opdrachtgever, f.bedrag, 
         f.datum_aangemaakt, f.datum_verstuur, f.datum_betaald, f.status, 
         f.beschrijving, f.notities, f.document_urls, f.created_at, f.updated_at, f.created_by
ORDER BY f.created_at DESC;

-- 6. Helper functions voor client management
CREATE OR REPLACE FUNCTION add_clients_to_factuur(
    p_factuur_id UUID,
    p_client_ids UUID[],
    p_client_names TEXT[]
) RETURNS VOID AS $$
DECLARE
    i INTEGER;
BEGIN
    -- Verwijder bestaande client koppelingen
    DELETE FROM factuur_clients WHERE factuur_id = p_factuur_id;
    
    -- Voeg nieuwe client koppelingen toe
    FOR i IN 1..COALESCE(array_length(p_client_ids, 1), 0) LOOP
        INSERT INTO factuur_clients (factuur_id, client_id, client_naam)
        VALUES (
            p_factuur_id, 
            p_client_ids[i], 
            COALESCE(p_client_names[i], 'Onbekende client')
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments voor documentatie
COMMENT ON TABLE factuur_clients IS 'Junction table voor many-to-many relatie tussen facturen en clients';
COMMENT ON COLUMN factuur_clients.factuur_id IS 'Referentie naar clientfactuur tabel';
COMMENT ON COLUMN factuur_clients.client_id IS 'Referentie naar clients tabel (optioneel)';
COMMENT ON COLUMN factuur_clients.client_naam IS 'Naam van de client (fallback als client_id niet beschikbaar is)';

COMMENT ON VIEW factuur_met_clients IS 'View die facturen toont met alle gekoppelde clients';
COMMENT ON FUNCTION add_clients_to_factuur IS 'Helper functie om clients toe te voegen aan een factuur';
