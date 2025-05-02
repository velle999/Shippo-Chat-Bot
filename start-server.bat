@echo off
setlocal enabledelayedexpansion
title ShippoBot Launcher 🐾

:: 🐾 Set working directory to script location
cd /d "%~dp0"

:: Step 1: Check for Node.js
echo 🔍 Checking for Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install it from https://nodejs.org/
    pause
    exit /b
)
echo ✅ Node.js is installed.

:: Step 2: Install dependencies if missing
if not exist node_modules (
    echo 📦 Installing npm dependencies...
    call npm install
    if errorlevel 1 (
        echo ❌ npm install failed. Fix errors above and try again.
        pause
        exit /b
    )
    echo ✅ Dependencies installed.
)

:: Step 3: Launch Ollama with LLaMA3 model in a background shell
echo 🧙‍♀️ Launching Ollama backend (LLaMA3)...
start "Ollama Backend" /MIN cmd /c "ollama run llama3"

:: Step 4: Launch Node server in new window
echo 🧠 Starting ShippoBot server...
start "ShippoBot Server" cmd /k "node server.js"

:: Step 5: Open browser to configuration UI
echo 🌐 Opening bot configuration UI...
start http://localhost:3000

echo 🐾 All systems go. Happy chatting!
exit /b
