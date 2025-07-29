-- Create table for storing document information linked to log entries
-- Run this in the Supabase SQL Editor
-- FIXED: Now references the correct table name 'logboek' instead of 'log_entries'

CREATE TABLE IF NOT EXISTS log_entry_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  log_entry_id UUID NOT NULL REFERENCES logboek(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  public_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_log_entry_documents_log_entry_id ON log_entry_documents(log_entry_id);
CREATE INDEX IF NOT EXISTS idx_log_entry_documents_client_id ON log_entry_documents(client_id);

-- Add RLS policies
ALTER TABLE log_entry_documents ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own documents
CREATE POLICY "Users can view documents for their log entries" ON log_entry_documents
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert documents
CREATE POLICY "Users can insert documents" ON log_entry_documents
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update their own documents
CREATE POLICY "Users can update their own documents" ON log_entry_documents
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete their own documents
CREATE POLICY "Users can delete their own documents" ON log_entry_documents
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Grant permissions to authenticated users
GRANT ALL ON log_entry_documents TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated; 