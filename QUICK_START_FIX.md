# 🚀 Quick Start Fix - MedDoc AI Flow

## Probleem Oplossing

Je hebt problemen gehad met het starten van de services. Hier zijn de oplossingen:

### ✅ Opgeloste Problemen

1. **ES Module vs CommonJS conflict** - `auto-start-services.js` is geconverteerd naar ES modules
2. **RAG Server pad probleem** - Nu gebruikt het `rag_server.py` in plaats van `advanced_rag_server.py`
3. **Python pad probleem** - Hardcoded pad verwijderd, gebruikt nu `python` command

### 🎯 Snelle Start Opties

#### Optie 1: Eenvoudige Scripts (Aanbevolen)

```bash
# Windows Command Prompt
simple-start.bat

# PowerShell
.\simple-start.ps1
```

#### Optie 2: NPM Scripts

```bash
# Start alle services
npm run dev

# Of individueel
npm run dev:frontend  # Frontend (port 3000)
npm run dev:backend   # Backend (port 8081)
npm run dev:rag       # RAG Server (port 5001)
```

#### Optie 3: Handmatig Starten

```bash
# Terminal 1 - Backend
node server.js

# Terminal 2 - RAG Server
python rag_server.py

# Terminal 3 - Frontend
npm run dev:frontend
```

### 🔧 Voorbereiding

1. **Environment Setup**

   ```bash
   # Kopieer env.example naar .env
   copy env.example .env

   # Vul je Supabase credentials in
   # SUPABASE_URL=https://your-project.supabase.co
   # SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **Test je setup**
   ```bash
   npm run verify
   ```

### 📋 Service URLs

Na succesvolle start:

- **Frontend**: http://localhost:3000
- **AI Chat**: http://localhost:3000/ai-chat
- **Backend Health**: http://localhost:8081/health
- **RAG API**: http://localhost:5001/health

### 🛠️ Troubleshooting

#### Python niet gevonden

```bash
# Installeer Python 3.x van https://python.org
# Of gebruik py command op Windows
py rag_server.py
```

#### Ports in gebruik

```bash
# Check welke processen de ports gebruiken
netstat -ano | findstr :3000
netstat -ano | findstr :8081
netstat -ano | findstr :5001

# Kill processen indien nodig
taskkill /PID <process_id> /F
```

#### Environment variables ontbreken

```bash
# Check environment
npm run check:env

# Of test services
npm run verify
```

### 📝 Belangrijke Bestanden

- `simple-start.bat` - Windows batch script
- `simple-start.ps1` - PowerShell script
- `test-services.js` - Service test script
- `rag_server.py` - RAG Server (Python)
- `server.js` - Backend Server (Node.js)

### 🎉 Succes!

Na het volgen van deze stappen zou je applicatie moeten werken. De frontend start op http://localhost:3000 en je kunt beginnen met het testen van de AI chat functionaliteit.

Voor verdere hulp, zie de andere README bestanden in dit project.
