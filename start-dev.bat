@echo off
REM Drishti AI - Integrated Development Server
REM This script starts both the backend and frontend servers

echo ================================
echo Drishti AI - Integrated Setup
echo ================================

REM Check if client node_modules exists
if not exist "client\node_modules" (
    echo Installing frontend dependencies...
    cd client
    call npm install
    cd ..
)

REM Check if Python venv exists
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
    call venv\Scripts\activate
    echo Installing Python dependencies...
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate
)

echo.
echo ================================
echo Starting Drishti AI Stack
echo ================================
echo.
echo Frontend will start at: http://localhost:5173
echo Backend API will be at: http://localhost:5000
echo.
echo To open in browser after startup:
echo - Development: http://localhost:5173
echo - Production: http://localhost:5000
echo.

REM Start Python backend in a new window
echo Starting Flask backend...
start "Drishti Backend" cmd /k "venv\Scripts\activate && python app.py"

timeout /t 3

REM Start frontend in a new window
echo Starting Vite frontend dev server...
start "Drishti Frontend" cmd /k "cd client && npm run dev"

timeout /t 3

echo.
echo ================================
echo Startup Complete!
echo Check the opened windows for logs
echo Press Ctrl+C in each window to stop
echo ================================
echo.
pause
