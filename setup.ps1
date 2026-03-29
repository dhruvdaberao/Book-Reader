# setup.ps1 - AudioBookify AI Setup Script

Write-Host "AudioBookify AI - Automated Setup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# 1. Check & Install Python Dependencies
Write-Host "`n[1] Setting up Python Environment for TTS..." -ForegroundColor Yellow
try {
    # Check if pip is installed
    $pipVersion = pip --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Python/pip is not installed or not in PATH! Please install Python 3.9+." -ForegroundColor Red
    } else {
        Write-Host "Installing Python packages (Coqui TTS and OpenAI)..." -ForegroundColor Yellow
        pip install TTS openai
        Write-Host "Python dependencies installed successfully." -ForegroundColor Green
    }
} catch {
    Write-Host "Could not install Python dependencies. Ensure Python is installed." -ForegroundColor Red
}

# 2. Check for Calibre (epub conversion support)
Write-Host "`n[2] Checking for Calibre CLI (ebook-convert)..." -ForegroundColor Yellow
try {
    $calibreCheck = ebook-convert --version 2>&1
    Write-Host "Calibre found! MOBI/PRC to EPUB conversion will work." -ForegroundColor Green
} catch {
    Write-Host "Calibre 'ebook-convert' not found in PATH." -ForegroundColor DarkYellow
    Write-Host "If you want to support .mobi or .prc files, please install Calibre and add it to your PATH." -ForegroundColor DarkYellow
}

# 3. Setup Server Environment
Write-Host "`n[3] Setting up Node.js Backend Server..." -ForegroundColor Yellow
if (Test-Path -Path "server") {
    Set-Location -Path "server"
    
    # Create required folders
    if (!(Test-Path -Path "uploads")) { New-Item -ItemType Directory -Force -Path "uploads" | Out-Null }
    if (!(Test-Path -Path "audio")) { New-Item -ItemType Directory -Force -Path "audio" | Out-Null }
    
    # Check if package.json exists to install
    if (Test-Path -Path "package.json") {
        Write-Host "Installing server dependencies via npm..." -ForegroundColor Yellow
        npm install
    }
    
    Set-Location -Path ".."
} else {
    Write-Host "Server folder not found. Please ensure it is created before running setup." -ForegroundColor Red
}

# 4. Setup Client Environment
Write-Host "`n[4] Setting up React Client..." -ForegroundColor Yellow
if (Test-Path -Path "client") {
    Set-Location -Path "client"
    if (Test-Path -Path "package.json") {
        Write-Host "Installing frontend dependencies via npm..." -ForegroundColor Yellow
        npm install
    }
    Set-Location -Path ".."
} else {
    Write-Host "Client folder not found. Please ensure it is created before running setup." -ForegroundColor Red
}

Write-Host "`nSetup complete! You can run the app using: .\start.ps1" -ForegroundColor Green
