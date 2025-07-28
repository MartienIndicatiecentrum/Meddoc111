-- SQL Schema voor Clientfactuur tabel
-- Voor gebruik in Supabase/PostgreSQL database

CREATE TABLE IF NOT EXISTS clientfactuur (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Factuurnummer (uniek identificatienummer)
    factuurnummer VARCHAR(50) UNIQUE NOT NULL,
    
    -- Client informatie
    client_id UUID, -- Removed foreign key constraint for now
    client_naam VARCHAR(255) NOT NULL,
    
    -- Opdrachtgever (enum type voor specifieke organisaties)
    opdrachtgever VARCHAR(100) NOT NULL CHECK (
        opdrachtgever IN (
            'Particulier',
            'Indicatiecentrum Nederland', 
            'IndicatieBureau Nederland',
            'Indicatie Nederland',
            'MMS'
        )
    ),
    
    -- Financiële informatie
    bedrag DECIMAL(10,2) NOT NULL CHECK (bedrag >= 0),
    
    -- Datum informatie
    datum_aangemaakt DATE NOT NULL DEFAULT CURRENT_DATE,
    datum_verstuur DATE,
    datum_betaald DATE,
    
    -- Document upload functionaliteit
    document_ids TEXT[], -- Array van document IDs die gekoppeld zijn aan deze factuur
    document_urls TEXT[], -- Array van URLs naar geüploade documenten
    
    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'concept' CHECK (
        status IN ('concept', 'verzonden', 'betaald', 'achterstallig', 'geannuleerd')
    ),
    
    -- Extra informatie
    beschrijving TEXT,
    notities TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID, -- Removed auth.users reference
    
    -- Indexen voor betere performance
    CONSTRAINT valid_dates CHECK (
        (datum_verstuur IS NULL OR datum_verstuur >= datum_aangemaakt) AND
        (datum_betaald IS NULL OR datum_betaald >= datum_verstuur OR datum_verstuur IS NULL)
    )
);

-- Indexen voor betere query performance
CREATE INDEX IF NOT EXISTS idx_clientfactuur_client_id ON clientfactuur(client_id);
CREATE INDEX IF NOT EXISTS idx_clientfactuur_factuurnummer ON clientfactuur(factuurnummer);
CREATE INDEX IF NOT EXISTS idx_clientfactuur_opdrachtgever ON clientfactuur(opdrachtgever);
CREATE INDEX IF NOT EXISTS idx_clientfactuur_status ON clientfactuur(status);
CREATE INDEX IF NOT EXISTS idx_clientfactuur_datum_verstuur ON clientfactuur(datum_verstuur);
CREATE INDEX IF NOT EXISTS idx_clientfactuur_datum_betaald ON clientfactuur(datum_betaald);
CREATE INDEX IF NOT EXISTS idx_clientfactuur_created_at ON clientfactuur(created_at);

-- Trigger voor automatische updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clientfactuur_updated_at 
    BEFORE UPDATE ON clientfactuur 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) policies voor Supabase
ALTER TABLE clientfactuur ENABLE ROW LEVEL SECURITY;

-- Policy: Users kunnen alleen hun eigen facturen zien
CREATE POLICY "Users can view their own invoices" ON clientfactuur
    FOR SELECT USING (auth.uid() = created_by);

-- Policy: Users kunnen facturen aanmaken
CREATE POLICY "Users can create invoices" ON clientfactuur
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Policy: Users kunnen hun eigen facturen updaten
CREATE POLICY "Users can update their own invoices" ON clientfactuur
    FOR UPDATE USING (auth.uid() = created_by);

-- Policy: Users kunnen hun eigen facturen verwijderen
CREATE POLICY "Users can delete their own invoices" ON clientfactuur
    FOR DELETE USING (auth.uid() = created_by);

-- Voorbeeld data voor testing (voer handmatig uit na tabel creatie)
-- INSERT INTO clientfactuur (
--     factuurnummer,
--     client_naam,
--     opdrachtgever,
--     bedrag,
--     datum_verstuur,
--     datum_betaald,
--     status,
--     beschrijving
-- ) VALUES 
-- (
--     'FAC-2024-001',
--     'A. Arkojan Arakelyan',
--     'Indicatiecentrum Nederland',
--     250.00,
--     '2024-01-15',
--     '2024-02-01',
--     'betaald',
--     'Medische consultatie en behandeling'
-- ),
-- (
--     'FAC-2024-002',
--     'M.J. van Langbroek',
--     'Particulier',
--     180.00,
--     '2024-01-20',
--     NULL,
--     'verzonden',
--     'Fysiotherapie sessies'
-- ),
-- (
--     'FAC-2024-003',
--     'B. de Vries',
--     'MMS',
--     320.00,
--     NULL,
--     NULL,
--     'concept',
--     'Psychologische evaluatie'
-- );

-- Views voor rapportage
CREATE OR REPLACE VIEW factuur_overzicht AS
SELECT 
    f.id,
    f.factuurnummer,
    f.client_naam,
    f.opdrachtgever,
    f.bedrag,
    f.datum_aangemaakt,
    f.datum_verstuur,
    f.datum_betaald,
    f.status,
    f.beschrijving,
    CASE 
        WHEN f.datum_betaald IS NOT NULL THEN 'Betaald'
        WHEN f.datum_verstuur IS NOT NULL AND f.datum_verstuur < CURRENT_DATE - INTERVAL '30 days' THEN 'Achterstallig'
        WHEN f.datum_verstuur IS NOT NULL THEN 'Verzonden'
        ELSE 'Concept'
    END as status_berekend,
    CASE 
        WHEN f.datum_betaald IS NOT NULL THEN 0
        ELSE GREATEST(0, CURRENT_DATE - COALESCE(f.datum_verstuur, f.datum_aangemaakt))
    END as dagen_uitstaand
FROM clientfactuur f
ORDER BY f.created_at DESC;

-- View voor financieel overzicht
CREATE OR REPLACE VIEW factuur_financieel_overzicht AS
SELECT 
    opdrachtgever,
    COUNT(*) as aantal_facturen,
    SUM(bedrag) as totaal_bedrag,
    SUM(CASE WHEN status = 'betaald' THEN bedrag ELSE 0 END) as betaald_bedrag,
    SUM(CASE WHEN status != 'betaald' THEN bedrag ELSE 0 END) as uitstaand_bedrag,
    AVG(bedrag) as gemiddeld_bedrag
FROM clientfactuur
GROUP BY opdrachtgever
ORDER BY totaal_bedrag DESC;

COMMENT ON TABLE clientfactuur IS 'Tabel voor het beheren van client facturen met document upload functionaliteit';
COMMENT ON COLUMN clientfactuur.factuurnummer IS 'Uniek factuurnummer voor identificatie';
COMMENT ON COLUMN clientfactuur.opdrachtgever IS 'Organisatie die de factuur ontvangt (Particulier/Indicatiecentrum Nederland/etc.)';
COMMENT ON COLUMN clientfactuur.document_ids IS 'Array van document IDs gekoppeld aan deze factuur';
COMMENT ON COLUMN clientfactuur.document_urls IS 'Array van URLs naar geüploade documenten';
COMMENT ON COLUMN clientfactuur.datum_verstuur IS 'Datum waarop factuur is verzonden';
COMMENT ON COLUMN clientfactuur.datum_betaald IS 'Datum waarop factuur is betaald';
