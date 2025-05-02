# 🐾 ShippoBot PowerShell Launcher
Write-Host "=============================="
Write-Host "🚀 Launching ShippoBot (PowerShell)"
Write-Host "=============================="

# Step 1: Set working directory
Set-Location -Path $PSScriptRoot

# Step 2: Check for Node.js
Write-Host "🔍 Checking for Node.js..."
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "❌ Node.js is not installed or not in PATH."
    Read-Host "Press Enter to exit"
    exit
}
Write-Host "✅ Node.js found."

# Step 3: Install dependencies if missing
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing npm dependencies..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ npm install failed. Check package.json."
        Read-Host "Press Enter to exit"
        exit
    }
    Write-Host "✅ Dependencies installed."
}

# Step 4: Launch Ollama (LLaMA3 backend)
Write-Host "🦙 Launching Ollama with LLaMA3..."
Start-Process "cmd.exe" -WindowStyle Minimized -ArgumentList '/c ollama run llama3'

# Step 5: Launch backend Node.js server
Write-Host "🧠 Starting backend server (server.js)..."
Start-Process "powershell.exe" -ArgumentList 'node server.js' -WindowStyle Normal

# Step 6: Open frontend config UI
Write-Host "🌐 Opening configuration UI in browser..."
Start-Process "http://localhost:3000"

Write-Host "✅ ShippoBot is launching!"
