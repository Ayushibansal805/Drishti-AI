#!/usr/bin/env pwsh
<#
.SYNOPSIS
Quick start script for Drishti AI - Starts both backend and frontend

.DESCRIPTION
This script:
1. Checks Python and Node.js installation
2. Installs/updates dependencies
3. Builds the frontend
4. Starts backend on port 5000
5. Starts frontend on port 5173

.PARAMETER DevMode
If set, runs with hot reload (recommended for development)

.EXAMPLE
.\start-dev.ps1 -DevMode
#>

param(
    [switch]$DevMode = $false
)

Write-Host "👁️  Drishti AI - Startup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Color functions
function Write-Success { Write-Host "✅ $args" -ForegroundColor Green }
function Write-Error { Write-Host "❌ $args" -ForegroundColor Red }
function Write-Info { Write-Host "ℹ️  $args" -ForegroundColor Blue }
function Write-Warning { Write-Host "⚠️  $args" -ForegroundColor Yellow }

# Check Python
Write-Info "Checking Python installation..."
try {
    $pythonVersion = python --version 2>&1
    Write-Success "Found $pythonVersion"
} catch {
    Write-Error "Python not found! Please install Python 3.8+"
    exit 1
}

# Check Node.js
Write-Info "Checking Node.js installation..."
try {
    $nodeVersion = node --version
    Write-Success "Found Node.js $nodeVersion"
} catch {
    Write-Error "Node.js not found! Please install Node.js 16+"
    exit 1
}

# Check backend model
Write-Info "Checking model file..."
if (Test-Path "trained_model.pth") {
    Write-Success "Model found"
} else {
    Write-Warning "trained_model.pth not found - backend will use untrained model"
}

# Install/Update backend dependencies
Write-Info "Setting up Python environment..."
if ((Test-Path "venv") -and (Test-Path "venv\Scripts\python.exe")) {
    Write-Success "Virtual environment exists"
    & "venv\Scripts\activate.ps1"
} else {
    Write-Info "Creating virtual environment..."
    python -m venv venv
    & "venv\Scripts\activate.ps1"
}

Write-Info "Installing/updating Python packages..."
pip install -q -r requirements.txt
if ($?) {
    Write-Success "Python dependencies installed"
} else {
    Write-Error "Failed to install Python dependencies"
    exit 1
}

# Install/Update frontend dependencies
Write-Info "Installing/updating Node.js packages..."
Set-Location client
npm install --quiet
if ($?) {
    Write-Success "Node dependencies installed"
} else {
    Write-Error "Failed to install Node dependencies"
    exit 1
}

# Build frontend
Write-Info "Building frontend..."
npm run build --quiet
if ($?) {
    Write-Success "Frontend built successfully"
} else {
    Write-Error "Failed to build frontend"
    exit 1
}

Set-Location ..

# Display connection info
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "🚀 Starting Drishti AI..." -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

if ($DevMode) {
    Write-Info "Starting in DEVELOPMENT mode (with hot reload)"
    Write-Info "Backend: http://localhost:5000"
    Write-Info "Frontend: http://localhost:5173 (with hot reload)"
    Write-Host ""
    Write-Warning "You need TWO terminal windows:"
    Write-Host "  1. Backend: Run 'python app.py'"
    Write-Host "  2. Frontend: Run 'cd client && npm run dev'"
    Write-Host ""
    pause
} else {
    Write-Info "Starting in PRODUCTION mode"
    Write-Info "Open browser to: http://localhost:5000"
    Write-Host ""
    Write-Info "Starting backend..."
    python app.py
}
