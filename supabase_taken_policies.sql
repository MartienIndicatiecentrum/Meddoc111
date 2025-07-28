-- RLS Policies for Taken table - Allow anonymous users full access
-- This is useful for development/testing environments

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.taken;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.taken;
DROP POLICY IF EXISTS "Enable update for all users" ON public.taken;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.taken;

-- Create permissive policies for anonymous users
-- These policies allow all operations for both authenticated and anonymous users

-- Allow SELECT (READ) for everyone including anonymous users
CREATE POLICY "Allow read for all users including anonymous" 
ON public.taken
FOR SELECT 
USING (true);

-- Allow INSERT (CREATE) for everyone including anonymous users
CREATE POLICY "Allow insert for all users including anonymous" 
ON public.taken
FOR INSERT 
WITH CHECK (true);

-- Allow UPDATE for everyone including anonymous users
CREATE POLICY "Allow update for all users including anonymous" 
ON public.taken
FOR UPDATE 
USING (true) 
WITH CHECK (true);

-- Allow DELETE for everyone including anonymous users
CREATE POLICY "Allow delete for all users including anonymous" 
ON public.taken
FOR DELETE 
USING (true);

-- Verify RLS is enabled (should already be enabled from previous script)
ALTER TABLE public.taken ENABLE ROW LEVEL SECURITY;

-- Optional: Check if the table exists and show its structure
-- Uncomment the lines below if you want to verify the table structure
-- \d public.taken
-- SELECT table_name, column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'taken' AND table_schema = 'public'
-- ORDER BY ordinal_position;

-- Show current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'taken' AND schemaname = 'public';
