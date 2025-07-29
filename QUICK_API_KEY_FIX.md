# 🚀 QUICK FIX - API Key Probleem

## Het Probleem
Je gebruikt de **service role key** in plaats van de **anon public key** in je `.env` bestand.

## Snelle Oplossing

### Stap 1: Open je .env bestand
Open het bestand `.env` in je project root.

### Stap 2: Zoek deze regel
```env
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0YXNqYmdhbW9sanZxb2NsZ2tmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk3MjgwMCwiZXhwIjoyMDUwNTQ4ODAwfQ.xxx
```

### Stap 3: Vervang met de juiste key
1. **Ga naar**: https://supabase.com/dashboard
2. **Selecteer project**: `ltasjbgamoljvqoclgkf`
3. **Settings** → **API**
4. **Kopieer de "anon" public key** (NIET service_role)
5. **Vervang de hele regel** in je `.env` bestand

### Stap 4: Test het
```bash
node direct-test.cjs
```

Je zou moeten zien:
```
✅ API key looks correct
✅ Database connection successful
```

### Stap 5: Herstart de applicatie
```bash
npm run dev
```

## 🔍 Hoe herken je het verschil?

**Service Role (NIET gebruiken):**
```
"role":"service_role"
```

**Anon Public (WEL gebruiken):**
```
"role":"anon"
```

## ✅ Resultaat
Na deze fix zou het logboek opslaan moeten werken!

**Test het nu op**: http://localhost:3001/logboek