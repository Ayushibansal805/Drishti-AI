# Drishti AI - Integrated Development Server (PowerShell)
# This script starts both the backend and frontend servers in separate processes

$ErrorActionPreference = "Continue"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Drishti AI - Integrated Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Change to script directory
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)
$rootDir = Get-Location
Write-Host "Working directory: $rootDir" -ForegroundColor Gray

# Check and install frontend dependencies
if (!(Test-Path "client/node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location "client"
    & npm install
    Pop-Location
    Write-Host "Frontend dependencies installed." -ForegroundColor Green
}

# Check and create Python virtual environment
if (!(Test-Path "venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    & python -m venv venv
    Write-Host "Virtual environment created." -ForegroundColor Green
}

# Activate virtual environment and install Python dependencies
Write-Host "Activating Python environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
& pip install -r requirements.txt -q
Write-Host "Python dependencies installed." -ForegroundColor Green

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Starting Drishti AI Stack" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend will start at: http://localhost:5173" -ForegroundColor Green
Write-Host "Backend API will be at: http://localhost:5000" -ForegroundColor Green
Write-Host ""

# Start Flask backend
Write-Host "Starting Flask backend..." -ForegroundColor Yellow
$backendProcess = Start-Process -FilePath "python" -ArgumentList "app.py" -PassThru
Write-Host "Backend started (PID: $($backendProcess.Id))" -ForegroundColor Green

# Wait a moment for backend to start
Start-Sleep -Seconds 2

# Start Vite frontend
Write-Host "Starting Vite frontend dev server..." -ForegroundColor Yellow
Push-Location "client"
$frontendProcess = Start-Process -FilePath "npm" -ArgumentList "run dev" -PassThru
Pop-Location
Write-Host "Frontend started (PID: $($frontendProcess.Id))" -ForegroundColor Green

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Startup Complete!" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Processes running:" -ForegroundColor Yellow
Write-Host "  Backend (Flask): PID $($backendProcess.Id)" -ForegroundColor Green
Write-Host "  Frontend (Vite): PID $($frontendProcess.Id)" -ForegroundColor Green
Write-Host ""
Write-Host "To stop:" -ForegroundColor Yellow
Write-Host "  Backend: taskkill /PID $($backendProcess.Id) /F" -ForegroundColor Gray
Write-Host "  Frontend: taskkill /PID $($frontendProcess.Id) /F" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to exit..." -ForegroundColor Yellow

# Wait for processes to complete
$backendProcess.WaitForExit()
$frontendProcess.WaitForExit()
