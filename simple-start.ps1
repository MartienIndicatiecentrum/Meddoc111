# Simple Start Script for MedDoc AI Flow
Write-Host "Starting MedDoc AI Flow Services..." -ForegroundColor Green
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with your configuration." -ForegroundColor Yellow
    Write-Host "Copy .env.example to .env and fill in your credentials." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Start Backend Server
Write-Host "Starting Backend Server..." -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "server.js" -WindowStyle Normal -PassThru | Out-Null

# Wait a moment
Start-Sleep -Seconds 3

# Start RAG Server (if Python is available)
Write-Host "Starting RAG Server..." -ForegroundColor Yellow
Start-Process -FilePath "python" -ArgumentList "rag_server.py" -WindowStyle Normal -PassThru | Out-Null

# Wait a moment
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend..." -ForegroundColor Magenta
Start-Process -FilePath "npm" -ArgumentList "run", "dev:frontend" -WindowStyle Normal -PassThru | Out-Null

Write-Host ""
Write-Host "All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor White
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:8081/health" -ForegroundColor Green
Write-Host "  RAG API:  http://localhost:5001/health" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
Read-Host 