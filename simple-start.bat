@echo off
echo Starting MedDoc AI Flow Services...
echo.

REM Check if .env exists
if not exist ".env" (
    echo ERROR: .env file not found!
    echo Please create a .env file with your configuration.
    echo Copy .env.example to .env and fill in your credentials.
    pause
    exit /b 1
)

REM Start Backend Server
echo Starting Backend Server...
start "Backend Server" cmd /k "node server.js"

REM Wait a moment
timeout /t 3 /nobreak >nul

REM Start RAG Server (if Python is available)
echo Starting RAG Server...
start "RAG Server" cmd /k "python rag_server.py"

REM Wait a moment
timeout /t 3 /nobreak >nul

REM Start Frontend
echo Starting Frontend...
start "Frontend" cmd /k "npm run dev:frontend"

echo.
echo All services started!
echo.
echo Service URLs:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8081/health
echo   RAG API:  http://localhost:5001/health
echo.
echo Press any key to close this window...
pause >nul 