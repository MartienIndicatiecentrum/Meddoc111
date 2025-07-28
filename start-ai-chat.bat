@echo off
echo Starting MedDoc AI Chat Services...
echo ================================

:: Start backend server in new window
echo Starting Node.js Backend (Port 8081)...
start "MedDoc Backend" cmd /k "cd meddoc-backend && node server.js"

:: Wait a bit for backend to start
timeout /t 3 /nobreak >nul

:: Start RAG server in new window
echo Starting Python RAG Server (Port 5000)...
start "MedDoc RAG" cmd /k "python advanced_rag_server.py"

:: Wait a bit for RAG server to start
timeout /t 3 /nobreak >nul

:: Start frontend
echo Starting Frontend (Port 3000)...
npm run dev:frontend

echo.
echo All services should be running now!
echo - Backend: http://localhost:8081
echo - RAG Server: http://localhost:5000
echo - Frontend: http://localhost:3000
echo.
pause