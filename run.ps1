#!/usr/bin/env pwsh
<#
.SYNOPSIS
Start Drishti AI with Image Description feature

.DESCRIPTION
Starts the Flask backend, React frontend, and optionally Ollama service

.PARAMETER WithOllama
Auto-start Ollama service (requires Ollama installed)

.PARAMETER BackendOnly
Only start the backend (no frontend)
#>

param(
    [switch]$WithOllama,
    [switch]$BackendOnly
)

Write-Host "
╔═══════════════════════════════════════════════════════════════╗
║            🚀 Starting Drishti AI with Image Description       ║
╚═══════════════════════════════════════════════════════════════╝
" -ForegroundColor Cyan

$dotenvFile = ".env"
$requiredAppKey = "set OPENAI_API_KEY"
$envConfigured = Test-Path $dotenvFile

if (-not $envConfigured) {
    Write-Host "⚠️  .env file not found!" -ForegroundColor Yellow
    Write-Host "   Run 'powershell ./setup.ps1' first to configure" -ForegroundColor Gray
    exit 1
}

# Check if OpenAI key is configured
$envContent = Get-Content $dotenvFile -Raw
if ($envContent -notmatch "OPENAI_API_KEY=sk-") {
    Write-Host "⚠️  OpenAI API key not configured in .env" -ForegroundColor Yellow
    Write-Host "   You can still use Ollama if running locally" -ForegroundColor Gray
}

# Start Ollama if requested
if ($WithOllama) {
    Write-Host "`n📦 Starting Ollama service..." -ForegroundColor Green
    
    $ollamaStatus = Test-Connection localhost:11434 -TcpPort -ErrorAction SilentlyContinue
    if (-not $ollamaStatus) {
        Write-Host "  Attempting to start Ollama..." -ForegroundColor Gray
        
        $ollamaPath = Get-Command ollama -ErrorAction SilentlyContinue
        if ($null -eq $ollamaPath) {
            Write-Host "  ❌ Ollama not found in PATH" -ForegroundColor Red
            Write-Host "     Install from: https://ollama.ai" -ForegroundColor Gray
        } else {
            # Start Ollama in background (Windows)
            Start-Process ollama -ArgumentList "serve" -WindowStyle Minimized
            Write-Host "  ⏳ Waiting for Ollama to start..." -ForegroundColor Gray
            Start-Sleep -Seconds 3
            
            $ollamaReady = Test-Connection localhost:11434 -TcpPort -ErrorAction SilentlyContinue
            if ($ollamaReady) {
                Write-Host "  ✓ Ollama started successfully" -ForegroundColor Green
            } else {
                Write-Host "  ⚠️  Ollama may not have started. Check Task Manager." -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "  ✓ Ollama is already running" -ForegroundColor Green
    }
}

# Start Flask Backend
Write-Host "`n🔧 Starting Flask Backend..." -ForegroundColor Green
Write-Host "   Backend will run on: http://localhost:5000" -ForegroundColor Gray

# Create a new PowerShell window for backend
$backendScript = @"
    Write-Host "Starting Flask Server..." -ForegroundColor Cyan
    Write-Host "Listening on http://localhost:5000" -ForegroundColor Green
    python app.py
    Write-Host "Backend stopped. Press any key to exit..." -NoNewLine
    `$null = `$Host.UI.RawUI.ReadKey('IncludeKeyDown')
"@

$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript -PassThru
Write-Host "  ✓ Backend process started (PID: $($backendProcess.Id))" -ForegroundColor Green

# Start Frontend
if (-not $BackendOnly) {
    Start-Sleep -Seconds 2
    Write-Host "`n⚛️  Starting React Frontend..." -ForegroundColor Green
    Write-Host "   Frontend will run on: http://localhost:5173" -ForegroundColor Gray
    
    # Check if Node dependencies are installed
    if (-not (Test-Path "client\node_modules")) {
        Write-Host "   Installing Node dependencies..." -ForegroundColor Gray
        Push-Location client
        npm install
        Pop-Location
    }
    
    Push-Location client
    
    $frontendScript = @"
        Write-Host "Starting Vite Dev Server..." -ForegroundColor Cyan
        Write-Host "Access the app at http://localhost:5173" -ForegroundColor Green
        npm run dev
        Write-Host "Frontend stopped. Press any key to exit..." -NoNewLine
        `$null = `$Host.UI.RawUI.ReadKey('IncludeKeyDown')
"@
    
    $frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendScript -PassThru
    Write-Host "  ✓ Frontend process started (PID: $($frontendProcess.Id))" -ForegroundColor Green
    
    Pop-Location
}

Write-Host "
╔═══════════════════════════════════════════════════════════════╗
║                  ✓ Services Started!                          ║
╚═══════════════════════════════════════════════════════════════╝

🌐 Access your app:
   Frontend: http://localhost:5173
   Backend:  http://localhost:5000/api/health
   
📊 Services running:
   ✓ Flask Backend
   $(if (-not $BackendOnly) { "✓ React Frontend" } else { "✗ Frontend (not started)" })
   $(if ($WithOllama -and (Test-Connection localhost:11434 -TcpPort -ErrorAction SilentlyContinue)) { "✓ Ollama" } else { "✗ Ollama (not started)" })

💡 Tips:
   • All windows will stay open for live development
   • Check browser console (F12) for frontend errors
   • Check backend window for server logs
   • Close any window to stop that service

🔐 Don't forget:
   • OpenAI API key must be set in .env
   • Ollama must be running for local descriptions
   • Both services need internet connection

📚 Documentation: SETUP_IMAGE_DESCRIPTION.md
" -ForegroundColor Cyan
