# 🚀 MedDoc AI Flow - Automatic Service Startup Guide

## Overview
The application now includes automatic startup for all required services with a single command!

## Quick Start

### One Command to Start Everything:
```bash
npm run dev
```

This single command will automatically start:
- ✅ **Backend API** (Port 8081) - Node.js server for database queries
- ✅ **RAG Server** (Port 5000) - Python server for document processing
- ✅ **Frontend** (Port 3000) - React application

## Features of the New Startup System

### 🎯 Automatic Service Management
- **Smart Port Detection**: Checks if ports are already in use before starting
- **Auto-Restart**: Services automatically restart if they crash
- **Graceful Shutdown**: Press `Ctrl+C` once to stop all services cleanly
- **Color-Coded Output**: Each service has its own color for easy monitoring
- **Cross-Platform**: Works on Windows, Mac, and Linux

### 📊 Service Monitoring
Each service output is prefixed with its name and color:
- `[Backend]` - Green
- `[RAG Server]` - Yellow
- `[Frontend]` - Cyan

### 🔗 Service URLs
After startup, access:
- **Frontend**: http://localhost:3000
- **AI Chat**: http://localhost:3000/ai-chat
- **Backend Health**: http://localhost:8081/health
- **RAG Health**: http://localhost:5000/health

## Alternative Startup Methods

### Individual Services
If you need to start services separately:

```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend

# RAG server only
npm run dev:rag
```

### Old Method (Concurrently)
The previous concurrent method is still available:
```bash
npm run dev:old
```

## Troubleshooting

### Port Already in Use
If you see "Port X is already in use":
1. The service might already be running
2. Check Task Manager (Windows) or Activity Monitor (Mac)
3. Kill any node.exe or python.exe processes using those ports

### Python/RAG Server Issues
Make sure Python is installed and in your PATH:
```bash
python --version
```

Install Python dependencies if needed:
```bash
pip install -r requirements.txt
```

### Backend Issues
Ensure backend dependencies are installed:
```bash
cd meddoc-backend
npm install
cd ..
```

### Environment Variables
Make sure `.env` file exists with required variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PORT=8081`

## How It Works

The `start-all-services.js` script:
1. Checks environment configuration
2. Verifies ports are available
3. Starts each service with proper error handling
4. Monitors service health and auto-restarts if needed
5. Handles shutdown signals gracefully

## Benefits

1. **Single Command**: No need to open multiple terminals
2. **Automatic Recovery**: Services restart if they crash
3. **Unified Logging**: See all service outputs in one place
4. **Clean Shutdown**: All services stop together
5. **Developer Friendly**: Color-coded output and clear error messages

## For Production

This setup is designed for development. For production:
- Use process managers like PM2 or systemd
- Deploy services to separate containers/servers
- Use proper logging and monitoring solutions