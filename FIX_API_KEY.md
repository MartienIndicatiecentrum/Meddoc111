# 🔑 Fix API Key - Service Role vs Anon Public

## Probleem
Je gebruikt de **service role key** in plaats van de **anon public key**. Dit veroorzaakt het opslaan probleem.

## Oplossing

### Stap 1: Ga naar je Supabase Dashboard
1. **Open**: https://supabase.com/dashboard
2. **Selecteer je project**: `ltasjbgamoljvqoclgkf`
3. **Ga naar Settings** → **API**

### Stap 2: Gebruik de JUISTE Key
Je ziet waarschijnlijk twee keys:

#### ❌ Service Role Key (NIET gebruiken)
- **Label**: "service_role" secret
- **Begint met**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Gebruik**: Alleen voor server-side code
- **Beveiliging**: Heeft admin rechten

#### ✅ Anon Public Key (WEL gebruiken)
- **Label**: "anon" public
- **Begint met**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Gebruik**: Voor frontend/browser code
- **Beveiliging**: Beperkte rechten, veilig voor browser

### Stap 3: Kopieer de Anon Public Key
1. **Zoek naar "anon" public** in de API sectie
2. **Klik op "Copy"** naast de anon public key
3. **De key begint met**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Stap 4: Update je .env bestand
Vervang je huidige API key met de anon public key:

```env
# Vervang dit:
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0YXNqYmdhbW9sanZxb2NsZ2tmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk3MjgwMCwiZXhwIjoyMDUwNTQ4ODAwfQ.service_role_key...

# Met dit (anon public key):
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0YXNqYmdhbW9sanZxb2NsZ2tmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4MDAsImV4cCI6MjA1MDU0ODgwMH0.anon_public_key...
```

### Stap 5: Herstart de applicatie
1. **Stop de applicatie** (Ctrl+C in de terminal)
2. **Start opnieuw**: `npm run dev`
3. **Controleer of de applicatie start zonder errors**

### Stap 6: Test de API Key
Voer dit commando uit om te controleren of de key werkt:

```bash
node direct-test.cjs
```

Je zou moeten zien:
```
✅ API key looks correct
✅ Database connection successful
```

### Stap 7: Voer het SQL Script uit
Na het fixen van de API key, voer dit SQL script uit in Supabase:

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

## 🔍 Hoe herken je het verschil?

### Service Role Key (NIET gebruiken voor frontend):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0YXNqYmdhbW9sanZxb2NsZ2tmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk3MjgwMCwiZXhwIjoyMDUwNTQ4ODAwfQ.xxx
```

### Anon Public Key (WEL gebruiken voor frontend):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0YXNqYmdhbW9sanZxb2NsZ2tmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4MDAsImV4cCI6MjA1MDU0ODgwMH0.xxx
```

**Het belangrijkste verschil**: `"role":"service_role"` vs `"role":"anon"`

## ✅ Resultaat
Na het gebruiken van de juiste anon public key zou het opslaan moeten werken!

**De applicatie draait al op http://localhost:3001 - probeer het nu!** 🚀