# start.ps1 - AudioBookify AI Startup Script

$ErrorActionPreference = "Stop"

Write-Host "Starting AudioBookify AI..." -ForegroundColor Cyan

# Start Backend Server
Write-Host "Starting Express Backend Server on port 3001..." -ForegroundColor Yellow
Start-Process -FilePath "npx" -ArgumentList "nodemon server.js" -WorkingDirectory ".\server"

# Start Frontend Client
Write-Host "Starting React Frontend on port 5173..." -ForegroundColor Yellow
cd .\client
npm run dev
