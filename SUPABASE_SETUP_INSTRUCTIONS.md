# Supabase Configuratie Instellen

## Probleem
De Supabase configuratie ontbreekt, waardoor het logboek niet kan opslaan.

## Oplossing

### Stap 1: Maak een .env bestand
Maak een `.env` bestand aan in de root van je project met de volgende inhoud:

```env
# MedDoc AI Flow - Environment Configuration

# Required: Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Anthropic API Key (for AI responses)
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# Optional: Server Configuration
PORT=8081
RAG_PORT=5001
DEBUG=false

# Optional: Additional Configuration
NODE_ENV=development
```

### Stap 2: Vind je Supabase configuratie
1. Ga naar [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecteer je project
3. Ga naar **Settings** → **API**
4. Kopieer de volgende waarden:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### Stap 3: Update je .env bestand
Vervang de placeholder waarden in je `.env` bestand:

```env
VITE_SUPABASE_URL=https://abc123def456.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Stap 4: Test de configuratie
Voer dit commando uit om te controleren of alles werkt:

```bash
node check-supabase-config.js
```

Je zou moeten zien:
```
🔍 Checking Supabase configuration...
Environment variables:
VITE_SUPABASE_URL: ✅ Set
VITE_SUPABASE_ANON_KEY: ✅ Set

✅ Supabase configuration looks good!
✅ Supabase client created successfully
```

### Stap 5: Voer de database fixes uit
Nadat de configuratie werkt, voer het SQL script uit in je Supabase SQL Editor:

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

### Stap 6: Test de database
Voer dit commando uit om de database te testen:

```bash
node test-logboek-save.cjs
```

### Stap 7: Start de applicatie
```bash
npm run dev
```

## Troubleshooting

### Als je geen Supabase project hebt:
1. Ga naar [Supabase](https://supabase.com)
2. Maak een gratis account aan
3. Maak een nieuw project
4. Ga naar **Settings** → **API** voor je configuratie

### Als de database test faalt:
1. Controleer of je Supabase project actief is
2. Controleer of de database tabellen bestaan
3. Controleer of je de juiste API keys gebruikt

### Als de applicatie niet start:
1. Controleer of alle dependencies geïnstalleerd zijn: `npm install`
2. Controleer of de .env bestand correct is ingesteld
3. Controleer of er geen andere processen op poort 3000 draaien

## Veiligheid
⚠️ **Let op**: Deel nooit je Supabase keys publiekelijk. Voeg `.env` toe aan je `.gitignore` bestand. 