# AI Chat Troubleshooting Guide

This guide helps you resolve common issues with the AI Chat feature in MedDoc AI Flow.

## Common Error: 500 Internal Server Error

If you're seeing "Failed to load resource: the server responded with a status of 500" errors in the AI Chat, follow these steps:

### 1. Check Environment Variables

First, verify that all required environment variables are configured:

```bash
npm run check:env
```

This will show you:
- ✅ Which variables are configured correctly
- ❌ Which required variables are missing
- ⚠️  Which optional variables could improve functionality

### 2. Required Environment Variables

Make sure your `.env` file contains:

```env
# Required for database connection
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional but recommended for AI responses
ANTHROPIC_API_KEY=your-claude-api-key
```

### 3. Start All Services

The AI Chat requires three services to be running:

```bash
npm run dev
```

This starts:
- **Frontend** (port 3000) - The React application
- **Backend** (port 8081) - Node.js API server for database queries
- **RAG Server** (port 5000) - Python server for document processing

### 4. Verify Services Are Running

Check that all services started successfully:

1. **Frontend**: http://localhost:3000
2. **Backend Health**: http://localhost:8081/health
3. **RAG Health**: http://localhost:5000/health

### 5. Debug Mode

If you're still having issues, enable debug mode to see detailed logs:

```env
DEBUG=true
```

Then restart the backend server to see all incoming requests and responses.

## Service-Specific Issues

### Backend Server (Database Mode)

If the database mode isn't working:

1. Check Supabase credentials are correct
2. Verify your Supabase project is accessible
3. Ensure the `documents` table exists in your database
4. Check the backend logs for specific error messages

### RAG Server (Uploaded Documents Mode)

If document upload/querying isn't working:

1. Ensure Python is installed
2. Install Python dependencies: `pip install -r requirements.txt`
3. Check that the RAG server started without errors
4. Verify the `lightrag_cache` directory has write permissions

## React Router Warnings

The v7_startTransition warnings are future compatibility flags and don't affect functionality. They've been addressed in the latest code updates.

## Still Having Issues?

1. Clear your browser cache and reload
2. Check the browser console for specific error messages
3. Look at the server logs in the terminal where you ran `npm run dev`
4. Try running services individually to isolate the issue:
   ```bash
   # Terminal 1
   npm run dev:backend
   
   # Terminal 2
   npm run dev:rag
   
   # Terminal 3
   npm run dev:frontend
   ```

## Quick Checklist

- [ ] `.env` file exists with required variables
- [ ] All services are running (`npm run dev`)
- [ ] No port conflicts (3000, 5000, 8081)
- [ ] Supabase project is accessible
- [ ] Python dependencies installed for RAG server
- [ ] Browser cache cleared if seeing old errors