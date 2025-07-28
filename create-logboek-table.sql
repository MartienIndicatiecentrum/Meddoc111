-- Create logboek table for communication logging
-- This script creates the logboek table with the correct structure

CREATE TABLE IF NOT EXISTS public.logboek (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Reference to client
    client_id UUID NOT NULL,
    
    -- Entry details
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    from_name TEXT NOT NULL,
    from_type TEXT NOT NULL CHECK (from_type IN ('client', 'employee', 'insurer', 'family', 'verzekeraar')),
    from_color TEXT DEFAULT 'bg-gray-500', -- CSS color class
    
    -- Message details
    type TEXT NOT NULL, -- Allow any type, including custom types
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'Geen urgentie' CHECK (status IN ('Geen urgentie', 'Licht urgent', 'Urgent', 'Reactie nodig', 'Afgehandeld', 'In behandeling')),
    is_urgent BOOLEAN DEFAULT FALSE,
    needs_response BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_logboek_client_id ON public.logboek(client_id);
CREATE INDEX IF NOT EXISTS idx_logboek_date ON public.logboek(date);
CREATE INDEX IF NOT EXISTS idx_logboek_from_type ON public.logboek(from_type);
CREATE INDEX IF NOT EXISTS idx_logboek_type ON public.logboek(type);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_logboek_updated_at 
    BEFORE UPDATE ON public.logboek 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.logboek ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust as needed for your authentication setup)
CREATE POLICY "Enable read access for all users" ON public.logboek
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.logboek
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.logboek
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.logboek
    FOR DELETE USING (true);

-- Add comments for documentation
COMMENT ON TABLE public.logboek IS 'Communication log for tracking all client communications';
COMMENT ON COLUMN public.logboek.type IS 'Type of message (Vraag Verzekeraar, Indicatie, Anders, or custom types)';
COMMENT ON COLUMN public.logboek.from_type IS 'Type of sender (client, employee, insurer, family)';

-- Show the created table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'logboek' 
AND table_schema = 'public'
ORDER BY ordinal_position; 