-- Fix RLS policies for log_entry_documents table
-- Run this in the Supabase SQL Editor

-- First, drop existing policies
DROP POLICY IF EXISTS "Users can view documents for their log entries" ON log_entry_documents;
DROP POLICY IF EXISTS "Users can insert documents" ON log_entry_documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON log_entry_documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON log_entry_documents;

-- Create new, more permissive policies
-- Allow all authenticated users to read documents
CREATE POLICY "Allow authenticated users to read documents" ON log_entry_documents
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow all authenticated users to insert documents
CREATE POLICY "Allow authenticated users to insert documents" ON log_entry_documents
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow all authenticated users to update documents
CREATE POLICY "Allow authenticated users to update documents" ON log_entry_documents
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow all authenticated users to delete documents
CREATE POLICY "Allow authenticated users to delete documents" ON log_entry_documents
  FOR DELETE USING (auth.role() = 'authenticated');

-- Alternative: If you want to disable RLS completely for this table (for development)
-- ALTER TABLE log_entry_documents DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to authenticated users
GRANT ALL ON log_entry_documents TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Also grant permissions to anon users if needed for development
GRANT ALL ON log_entry_documents TO anon;
GRANT USAGE ON SCHEMA public TO anon; 