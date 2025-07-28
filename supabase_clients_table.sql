-- Create Taken table for improved task management
-- This table includes all the new fields we added to the task form

CREATE TABLE IF NOT EXISTS public.Taken (
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_taken_client_id ON public.Taken(client_id);
CREATE INDEX IF NOT EXISTS idx_taken_status ON public.Taken(status);
CREATE INDEX IF NOT EXISTS idx_taken_prioriteit ON public.Taken(prioriteit);
CREATE INDEX IF NOT EXISTS idx_taken_deadline ON public.Taken(deadline);
CREATE INDEX IF NOT EXISTS idx_taken_taak_datum ON public.Taken(taak_datum);
CREATE INDEX IF NOT EXISTS idx_taken_created_at ON public.Taken(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_taken_updated_at 
    BEFORE UPDATE ON public.Taken 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.Taken ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust as needed for your authentication setup)
CREATE POLICY "Enable read access for all users" ON public.Taken
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.Taken
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.Taken
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.Taken
    FOR DELETE USING (true);

-- Add comments for documentation
COMMENT ON TABLE public.Taken IS 'Enhanced task management table with support for dates, times, insurance info, and document uploads';
COMMENT ON COLUMN public.Taken.taak_type IS 'Type of task from dropdown (indicatie, vraagstelling, etc.)';
COMMENT ON COLUMN public.Taken.taak_datum IS 'Date when the task should be performed';
COMMENT ON COLUMN public.Taken.taak_tijd IS 'Time when the task should be performed';
COMMENT ON COLUMN public.Taken.extra_notitie IS 'Additional notes for specific task types (e.g., changes needed)';
COMMENT ON COLUMN public.Taken.verzekeraar IS 'Insurance company for insurance-related tasks';
COMMENT ON COLUMN public.Taken.upload_documenten IS 'JSON array of uploaded document references';
