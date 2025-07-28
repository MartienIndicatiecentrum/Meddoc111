-- Create client_notes table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_notes') THEN
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

        -- Enable Row Level Security
        ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        CREATE POLICY "Users can view client notes" 
        ON public.client_notes FOR SELECT 
        USING (true);

        CREATE POLICY "Users can create client notes" 
        ON public.client_notes FOR INSERT 
        WITH CHECK (true);

        CREATE POLICY "Users can update client notes" 
        ON public.client_notes FOR UPDATE 
        USING (true);

        CREATE POLICY "Users can delete client notes" 
        ON public.client_notes FOR DELETE 
        USING (true);

        RAISE NOTICE 'Created client_notes table';
    ELSE
        RAISE NOTICE 'client_notes table already exists';
    END IF;
END $$; 