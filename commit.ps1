# Git Auto-Commit PowerShell Script
# Sla op als: commit.ps1

Write-Host "================================" -ForegroundColor Cyan
Write-Host "    Git Auto-Commit Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Controleer of we in een git repository zitten
if (-not (Test-Path ".git")) {
    Write-Host "[ERROR] Geen git repository gevonden in deze map!" -ForegroundColor Red
    Write-Host "Zorg ervoor dat je het script uitvoert in je project directory." -ForegroundColor Yellow
    Read-Host "Druk Enter om door te gaan"
    exit 1
}

# Haal huidige branch naam op
try {
    $currentBranch = git branch --show-current
    Write-Host "Huidige branch: $currentBranch" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Kan branch informatie niet ophalen" -ForegroundColor Red
    Read-Host "Druk Enter om door te gaan"
    exit 1
}

# Controleer voor uncommitted changes
$hasChanges = git diff-index --quiet HEAD --
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[INFO] Uncommitted changes gevonden..." -ForegroundColor Yellow
    
    # Toon status
    Write-Host ""
    Write-Host "=== Git Status ===" -ForegroundColor Cyan
    git status --short
    Write-Host ""
    
    # Vraag om commit message
    $commitMsg = Read-Host "Voer commit message in (druk Enter voor automatische message)"
    
    # Gebruik automatische message als leeg
    if ([string]::IsNullOrWhiteSpace($commitMsg)) {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $commitMsg = "Auto-commit: Updates op $timestamp"
    }
    
    # Add alle changes
    Write-Host "[INFO] Adding alle changes..." -ForegroundColor Yellow
    git add .
    
    # Commit
    Write-Host "[INFO] Committing met message: `"$commitMsg`"" -ForegroundColor Yellow
    git commit -m $commitMsg
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[SUCCESS] Commit succesvol!" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Commit gefaald!" -ForegroundColor Red
        Read-Host "Druk Enter om door te gaan"
        exit 1
    }
} else {
    Write-Host "[INFO] Geen uncommitted changes gevonden." -ForegroundColor Green
}

# Check of remote bestaat
try {
    git remote get-url origin | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "[INFO] Pushing naar GitHub..." -ForegroundColor Yellow
        git push origin $currentBranch
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[SUCCESS] Push naar GitHub succesvol!" -ForegroundColor Green
        } else {
            Write-Host "[WARNING] Push naar GitHub gefaald. Controleer je internet verbinding en GitHub credentials." -ForegroundColor Yellow
        }
    }
}
catch {
    Write-Host "[WARNING] Geen remote repository (origin) gevonden. Alleen lokaal gecommit." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[INFO] Script voltooid!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Read-Host "Druk Enter om door te gaan"