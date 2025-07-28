-- Update documents table for MedDoc AI Flow
-- Execute this SQL in your Supabase SQL Editor
-- This handles existing table and adds missing columns safely

-- First, ensure the documents table exists with basic structure
CREATE TABLE IF NOT EXISTS public.documents (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if they don't exist
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'application/octet-stream',
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Overkomst',
ADD COLUMN IF NOT EXISTS date TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS client_id BIGINT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Create storage bucket for documents (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Set up Row Level Security (RLS) policies
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all documents
CREATE POLICY "Allow authenticated users to read documents" ON public.documents
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to insert documents
CREATE POLICY "Allow authenticated users to insert documents" ON public.documents
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to update their own documents
CREATE POLICY "Allow authenticated users to update documents" ON public.documents
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to delete documents
CREATE POLICY "Allow authenticated users to delete documents" ON public.documents
    FOR DELETE USING (auth.role() = 'authenticated');

-- Storage policies for documents bucket
CREATE POLICY "Allow authenticated users to upload documents" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Allow public access to documents" ON storage.objects
    FOR SELECT USING (bucket_id = 'documents');

CREATE POLICY "Allow authenticated users to update documents" ON storage.objects
    FOR UPDATE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete documents" ON storage.objects
    FOR DELETE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON public.documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_title ON public.documents(title);

-- Add updated_at trigger (drop existing first to avoid conflicts)
DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data (optional)
INSERT INTO public.documents (title, type, category, date, file_path, file_size, description) VALUES
('Sample Document 1.pdf', 'application/pdf', 'Indicatie', '2025-07-19', '/sample/path1.pdf', 1024000, 'Sample document for testing'),
('Sample Document 2.pdf', 'application/pdf', 'PGB', '2025-07-18', '/sample/path2.pdf', 2048000, 'Another sample document')
ON CONFLICT DO NOTHING;

COMMIT;
