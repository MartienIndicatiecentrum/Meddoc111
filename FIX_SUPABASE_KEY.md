# 🔑 Fix Supabase API Key

## Probleem
De Supabase API key is niet correct ingesteld, waardoor berichten niet kunnen worden opgeslagen.

## Oplossing

### Stap 1: Vind je Supabase API Key
1. **Ga naar**: https://supabase.com/dashboard
2. **Selecteer je project**: `ltasjbgamoljvqoclgkf`
3. **Ga naar Settings** → **API**
4. **Kopieer de "anon public" key** (niet de service_role key!)

### Stap 2: Update je .env bestand
Open je `.env` bestand en vervang de placeholder waarde:

```env
# Vervang dit:
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Met je echte API key (bijvoorbeeld):
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0YXNqYmdhbW9sanZxb2NsZ2tmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4MDAsImV4cCI6MjA1MDU0ODgwMH0.abc123...
```

### Stap 3: Test de configuratie
Voer dit commando uit:

```bash
node debug-logboek.cjs
```

Je zou moeten zien:
```
✅ Clients found: [...]
✅ Logboek table accessible
✅ Logboek entry created successfully
```

### Stap 4: Herstart de applicatie
Na het updaten van de .env bestand:

1. **Stop de applicatie** (Ctrl+C in de terminal)
2. **Start opnieuw**: `npm run dev`
3. **Test het logboek**: http://localhost:3001/logboek

### Stap 5: Voer het SQL script uit
Als de API key werkt, voer dan het SQL script uit in Supabase:

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

## 🔍 Waar vind je de API key?
- **Project URL**: `https://ltasjbgamoljvqoclgkf.supabase.co`
- **anon public key**: Begint met `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## ⚠️ Belangrijk
- Gebruik de **anon public** key, niet de service_role key
- De key moet beginnen met `eyJ...`
- Voeg geen quotes toe rond de key in het .env bestand

**Na deze stappen zou het automatisch opslaan moeten werken!** 🚀 