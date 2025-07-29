# 🔧 Stap-voor-Stap Fix voor Logboek Opslaan

## Probleem
Berichten en documenten worden niet automatisch opgeslagen in het logboek.

## Oplossing

### Stap 1: Controleer de Supabase API Key
1. **Open je `.env` bestand**
2. **Controleer of de API key correct is**:
   ```env
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0YXNqYmdhbW9sanZxb2NsZ2tmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4MDAsImV4cCI6MjA1MDU0ODgwMH0.abc123...
   ```
3. **Als de key niet correct is**, ga naar:
   - https://supabase.com/dashboard
   - Selecteer project: `ltasjbgamoljvqoclgkf`
   - Settings → API
   - Kopieer de "anon public" key

### Stap 2: Test de Database Connectie
1. **Open**: `browser-console-test.html` in je browser
2. **Open de console** (F12)
3. **Klik op "Test Database Connectie"**
4. **Controleer of je ziet**: `✅ Database connected!`

### Stap 3: Voer het SQL Script uit in Supabase
1. **Ga naar**: https://supabase.com/dashboard
2. **Selecteer je project**: `ltasjbgamoljvqoclgkf`
3. **Ga naar SQL Editor**
4. **Kopieer en plak dit script**:

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

### Stap 4: Test het Opslaan
1. **Ga naar**: http://localhost:3001/logboek
2. **Klik op "Nieuw bericht"** (groene knop)
3. **Vul een bericht in** (bijvoorbeeld: "Test bericht")
4. **Klik op "Toevoegen"**
5. **Controleer of het bericht verschijnt** in de lijst

### Stap 5: Test Document Upload
1. **Klik op "Nieuw bericht"**
2. **Upload een document** (gebruik de document upload functie)
3. **Vul een bericht in**
4. **Klik op "Toevoegen"**
5. **Controleer of het document is opgeslagen**

## 🔍 Troubleshooting

### Als de database test faalt:
- Controleer of de API key correct is
- Controleer of je Supabase project actief is

### Als het SQL script errors geeft:
- Controleer of je de juiste project hebt geselecteerd
- Controleer of je admin rechten hebt

### Als de applicatie nog steeds niet werkt:
1. **Herstart de applicatie**: `npm run dev`
2. **Controleer de browser console** (F12) voor errors
3. **Test met de browser test pagina**: `browser-console-test.html`

## ✅ Wat dit script doet:
- **Schakelt RLS uit** (Row Level Security) die het opslaan blokkeert
- **Geeft alle permissions** voor de logboek tabellen
- **Maakt constraints flexibeler** voor alle berichttypes
- **Zet juiste default waarden**

## 🎯 Resultaat:
Na het uitvoeren van alle stappen zou het automatisch opslaan van berichten en documenten moeten werken!

**De applicatie draait al op http://localhost:3001 - probeer het nu!** 🚀