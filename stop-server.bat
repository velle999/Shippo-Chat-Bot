@echo off
title 🛑 Stopping ShippoBot Services
echo ================================
echo 🔍 Attempting to stop ShippoBot...
echo ================================

REM Kill server bound to port 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo ⚙️ Terminating server on port 3000 [PID %%a]
    taskkill /PID %%a /F >nul 2>&1
)

REM Kill bot.js specifically (avoids killing all node processes)
for /f "tokens=2 delims=," %%b in ('tasklist /v /fo csv ^| findstr /i "node" ^| findstr /i "bot.js"') do (
    echo 🧠 Terminating bot.js process [PID %%b]
    taskkill /PID %%b /F >nul 2>&1
)

REM Optional: stop Ollama backend if running
for /f "tokens=2 delims=," %%c in ('tasklist /v /fo csv ^| findstr /i "ollama"') do (
    echo 🧙‍♂️ Stopping Ollama backend [PID %%c]
    taskkill /PID %%c /F >nul 2>&1
)

echo ✅ ShippoBot shutdown complete.
pause >nul
