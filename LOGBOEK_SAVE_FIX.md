# Logboek Opslaan Probleem - Oplossing

## Probleem
Het bericht en documenten worden niet automatisch opgeslagen in het logboek.

## Oorzaak
Er zijn verschillende problemen met de database setup:
1. **RLS (Row Level Security) policies** blokkeren het opslaan
2. **Database constraints** zijn te strikt
3. **Permissions** zijn niet correct ingesteld
4. **Error handling** is niet voldoende

## Oplossing

### Stap 1: Database Fixes
Voer dit SQL script uit in je Supabase SQL Editor:

```sql
-- Fix logboek save issues - Run this in Supabase SQL Editor
-- This script fixes the constraints and permissions that prevent automatic saving

-- 1. Disable RLS temporarily to allow all operations
ALTER TABLE public.logboek DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_entry_documents DISABLE ROW LEVEL SECURITY;

-- 2. Grant all necessary permissions
GRANT ALL ON public.logboek TO authenticated;
GRANT ALL ON public.logboek TO anon;
GRANT ALL ON public.log_entry_documents TO authenticated;
GRANT ALL ON public.log_entry_documents TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- 3. Fix the constraints to allow all the types we need
-- Drop existing constraints
ALTER TABLE public.logboek DROP CONSTRAINT IF EXISTS logboek_from_type_check;
ALTER TABLE public.logboek DROP CONSTRAINT IF EXISTS logboek_type_check;
ALTER TABLE public.logboek DROP CONSTRAINT IF EXISTS logboek_status_check;

-- Add flexible constraints that allow all the types we need
ALTER TABLE public.logboek ADD CONSTRAINT logboek_from_type_check
    CHECK (from_type IN ('client', 'employee', 'insurer', 'family', 'verzekeraar'));

-- Allow any type for the type field (including custom types)
ALTER TABLE public.logboek ADD CONSTRAINT logboek_type_check
    CHECK (type IS NOT NULL AND length(trim(type)) > 0);

-- Allow all status values we need
ALTER TABLE public.logboek ADD CONSTRAINT logboek_status_check
    CHECK (status IN ('Geen urgentie', 'Licht urgent', 'Urgent', 'Reactie nodig', 'Afgehandeld', 'In behandeling'));

-- 4. Update default values
ALTER TABLE public.logboek ALTER COLUMN status SET DEFAULT 'Geen urgentie';
ALTER TABLE public.logboek ALTER COLUMN from_color SET DEFAULT 'bg-gray-500';

-- 5. Ensure the log_entry_documents table exists and has correct structure
CREATE TABLE IF NOT EXISTS public.log_entry_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  log_entry_id UUID NOT NULL REFERENCES public.logboek(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  public_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_log_entry_documents_log_entry_id ON public.log_entry_documents(log_entry_id);
CREATE INDEX IF NOT EXISTS idx_log_entry_documents_client_id ON public.log_entry_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_logboek_client_id ON public.logboek(client_id);
CREATE INDEX IF NOT EXISTS idx_logboek_date ON public.logboek(date);

-- 7. Create the updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_logboek_updated_at ON public.logboek;
CREATE TRIGGER update_logboek_updated_at
    BEFORE UPDATE ON public.logboek
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_log_entry_documents_updated_at ON public.log_entry_documents;
CREATE TRIGGER update_log_entry_documents_updated_at
    BEFORE UPDATE ON public.log_entry_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Stap 2: Test de Database
Voer dit test script uit om te controleren of alles werkt:

```bash
node test-logboek-save.js
```

### Stap 3: Verbeterde Error Handling
De code is al verbeterd met:
- Betere error logging
- Validatie van invoer
- Duidelijkere foutmeldingen
- Try-catch blocks voor document uploads

### Stap 4: Controleer de Console
Open de browser console (F12) en kijk naar:
- Database connection errors
- Permission errors
- Constraint violation errors
- Network errors

## Wat er is verbeterd

### 1. Database Permissions
- RLS is uitgeschakeld voor logboek tabellen
- Alle benodigde permissions zijn toegekend
- Schema usage is toegekend

### 2. Database Constraints
- Type constraints zijn flexibeler gemaakt
- Status constraints ondersteunen alle waarden
- From_type constraints zijn uitgebreid

### 3. Error Handling
- Betere logging in clientService
- Duidelijkere foutmeldingen voor gebruikers
- Validatie van invoer voordat opslaan

### 4. Document Upload
- Verbeterde error handling voor document uploads
- Fallback mechanismen als upload faalt
- Betere logging van upload process

## Testen

1. **Voer het SQL script uit** in Supabase
2. **Test de database** met het test script
3. **Probeer een bericht toe te voegen** in de applicatie
4. **Controleer de console** voor errors
5. **Test document upload** als dat nodig is

## Als het nog steeds niet werkt

1. **Controleer de Supabase configuratie** in je `.env` bestand
2. **Controleer of de database tabellen bestaan**
3. **Controleer de browser console** voor specifieke errors
4. **Test de database connectie** met het test script

## Veiligheid

⚠️ **Let op**: Het uitschakelen van RLS maakt de database minder veilig. Voor productie zou je specifieke RLS policies moeten maken in plaats van RLS volledig uit te schakelen.

Voor productie, maak specifieke policies:
```sql
-- Voor productie: specifieke RLS policies
CREATE POLICY "Enable read access for authenticated users" ON public.logboek
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" ON public.logboek
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```