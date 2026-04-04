#!/usr/bin/env pwsh
<#
.SYNOPSIS
Setup script for Drishti AI with Image Description feature

.DESCRIPTION
Initializes the Drishti AI environment with Ollama and OpenAI configuration

.PARAMETER SkipOllama
Skip Ollama setup (use only if already installed)

.PARAMETER SkipOpenAI
Skip OpenAI setup (use only if you have existing .env)
#>

param(
    [switch]$SkipOllama,
    [switch]$SkipOpenAI
)

Write-Host "
╔═══════════════════════════════════════════════════════════════╗
║          🖼️  Drishti AI - Image Description Setup             ║
╚═══════════════════════════════════════════════════════════════╝
" -ForegroundColor Cyan

# Check Python
Write-Host "✓ Checking Python installation..." -ForegroundColor Green
$pythonTest = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Python not found! Please install Python 3.8+" -ForegroundColor Red
    exit 1
}
Write-Host "  Found: $pythonTest" -ForegroundColor Gray

# Install Python dependencies
Write-Host "`n✓ Installing Python packages..." -ForegroundColor Green
pip install -r requirements.txt | Out-Host
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install Python packages" -ForegroundColor Red
    exit 1
}

# Setup .env file
if (-not (Test-Path ".env")) {
    Write-Host "`n✓ Creating .env configuration file..." -ForegroundColor Green
    Copy-Item ".env.example" ".env"
    Write-Host "  Created .env (edit to add your OpenAI API key)" -ForegroundColor Gray
} else {
    Write-Host "`n✓ .env file already exists" -ForegroundColor Green
}

# Check Ollama
if (-not $SkipOllama) {
    Write-Host "`n✓ Checking Ollama installation..." -ForegroundColor Green
    
    $ollamaInstalled = Get-Command ollama -ErrorAction SilentlyContinue
    if ($null -eq $ollamaInstalled) {
        Write-Host "
⚠️  Ollama not found in PATH
   Download from: https://ollama.ai
   After installation, run: ollama serve
   Then in another terminal: ollama pull llava" -ForegroundColor Yellow
    } else {
        Write-Host "  Found Ollama installed" -ForegroundColor Gray
        
        # Check if Ollama service is running
        $ollamaRunning = Test-Connection localhost:11434 -TcpPort -ErrorAction SilentlyContinue
        if ($ollamaRunning) {
            Write-Host "  ✓ Ollama is running on localhost:11434" -ForegroundColor Green
            
            # Check for llava model
            Write-Host "  Checking for llava model..." -ForegroundColor Gray
            $models = ollama list 2>&1
            if ($models -match "llava") {
                Write-Host "  ✓ llava model is downloaded" -ForegroundColor Green
            } else {
                Write-Host "  ⚠️  llava model not found, downloading..." -ForegroundColor Yellow
                ollama pull llava
            }
        } else {
            Write-Host "  ⚠️  Ollama is not running" -ForegroundColor Yellow
            Write-Host "     Start with: ollama serve" -ForegroundColor Gray
        }
    }
}

# Setup OpenAI API Key
if (-not $SkipOpenAI) {
    Write-Host "`n✓ OpenAI API Configuration" -ForegroundColor Green
    
    $hasKey = Select-String -Path ".env" -Pattern "OPENAI_API_KEY=sk-" -ErrorAction SilentlyContinue
    if ($null -eq $hasKey) {
        Write-Host "
⚠️  OpenAI API key not configured
   Steps to add:
   1. Get key from: https://platform.openai.com/api-keys
   2. Open .env file
   3. Replace 'sk-your-key-here' with your actual key
   4. Save and restart the app" -ForegroundColor Yellow
    } else {
        Write-Host "  ✓ OpenAI API key is configured" -ForegroundColor Green
    }
}

# Frontend setup
Write-Host "`n✓ Frontend setup..." -ForegroundColor Green
if (Test-Path "client\node_modules") {
    Write-Host "  Node dependencies already installed" -ForegroundColor Gray
} else {
    Write-Host "  Installing Node dependencies (first time only)..." -ForegroundColor Gray
    Push-Location client
    npm install
    Pop-Location
}

# Summary
Write-Host "
╔═══════════════════════════════════════════════════════════════╗
║                  ✓ Setup Complete!                            ║
╚═══════════════════════════════════════════════════════════════╝

📝 Next steps:

  1. Edit .env file and add your OpenAI API key:
     • Get key from: https://platform.openai.com/api-keys
     • Edit file: .env
     • Set: OPENAI_API_KEY=sk-xxxx...

  2. Start Ollama (if you want local image descriptions):
     ollama serve

  3. Start the application (in this directory):
     • Terminal 1: python app.py
     • Terminal 2: cd client && npm run dev

  4. Open browser: http://localhost:5173

🚀 Ready to go! Upload an image and watch the magic happen.

📚 Documentation: See SETUP_IMAGE_DESCRIPTION.md for detailed info
" -ForegroundColor Cyan

Write-Host "`nPress any key to continue..." -NoNewLine
$null = $Host.UI.RawUI.ReadKey("IncludeKeyDown")
