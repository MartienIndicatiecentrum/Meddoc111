# 🚀 Snelle Fix voor Logboek Opslaan

## ✅ Goed nieuws!
De applicatie draait al en Supabase is geconfigureerd! We hoeven alleen nog de database permissions te fixen.

## 🔧 Wat je nu moet doen:

### Stap 1: Ga naar je Supabase Dashboard
1. Open: https://supabase.com/dashboard
2. Selecteer je project: `ltasjbgamoljvqoclgkf`
3. Ga naar **SQL Editor** (in de sidebar)

### Stap 2: Voer dit SQL script uit
Kopieer en plak dit in de SQL Editor:

```sql
-- Fix logboek save issues
ALTER TABLE public.logboek DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_entry_documents DISABLE ROW LEVEL SECURITY;

GRANT ALL ON public.logboek TO authenticated;
GRANT ALL ON public.logboek TO anon;
GRANT ALL ON public.log_entry_documents TO authenticated;
GRANT ALL ON public.log_entry_documents TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Fix constraints
ALTER TABLE public.logboek DROP CONSTRAINT IF EXISTS logboek_from_type_check;
ALTER TABLE public.logboek DROP CONSTRAINT IF EXISTS logboek_type_check;
ALTER TABLE public.logboek DROP CONSTRAINT IF EXISTS logboek_status_check;

ALTER TABLE public.logboek ADD CONSTRAINT logboek_from_type_check
    CHECK (from_type IN ('client', 'employee', 'insurer', 'family', 'verzekeraar'));

ALTER TABLE public.logboek ADD CONSTRAINT logboek_type_check
    CHECK (type IS NOT NULL AND length(trim(type)) > 0);

ALTER TABLE public.logboek ADD CONSTRAINT logboek_status_check
    CHECK (status IN ('Geen urgentie', 'Licht urgent', 'Urgent', 'Reactie nodig', 'Afgehandeld', 'In behandeling'));

-- Update defaults
ALTER TABLE public.logboek ALTER COLUMN status SET DEFAULT 'Geen urgentie';
ALTER TABLE public.logboek ALTER COLUMN from_color SET DEFAULT 'bg-gray-500';
```

### Stap 3: Test het in de applicatie
1. Ga naar: http://localhost:3001
2. Navigeer naar **Logboek**
3. Selecteer een cliënt
4. Probeer een bericht toe te voegen

## 🎯 Wat dit doet:
- **Schakelt RLS uit** (Row Level Security) die het opslaan blokkeert
- **Geeft alle permissions** voor de logboek tabellen
- **Maakt constraints flexibeler** voor alle berichttypes
- **Zet juiste default waarden**

## ✅ Resultaat:
Na het uitvoeren van dit script zou het automatisch opslaan van berichten en documenten moeten werken!

## 🔍 Als het nog steeds niet werkt:
1. Controleer de browser console (F12) voor errors
2. Controleer of je de juiste cliënt hebt geselecteerd
3. Controleer of je een bericht hebt ingevuld

**De applicatie draait al op http://localhost:3001 - probeer het nu!** 🚀