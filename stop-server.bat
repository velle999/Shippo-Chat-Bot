@echo off
title 🛑 Stopping ShippoBot Services
echo ================================
echo 🔍 Attempting to stop ShippoBot...
echo ================================

REM Kill server on port 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo ⚙️ Terminating server on port 3000 [PID %%a]
    taskkill /PID %%a /F >nul 2>&1
)

REM Kill any node process running bot.js
for /f "tokens=2 delims=," %%b in ('tasklist /v /fo csv ^| findstr /i "node" ^| findstr /i "bot.js"') do (
    echo 🧠 Terminating bot.js [PID %%b]
    taskkill /PID %%b /F >nul 2>&1
)

REM Kill any node process running server.js
for /f "tokens=2 delims=," %%c in ('tasklist /v /fo csv ^| findstr /i "node" ^| findstr /i "server.js"') do (
    echo 🛠️ Terminating server.js [PID %%c]
    taskkill /PID %%c /F >nul 2>&1
)

REM Kill the Ollama backend if running
for /f "tokens=2 delims=," %%d in ('tasklist /v /fo csv ^| findstr /i "ollama"') do (
    echo 🧙‍♂️ Terminating Ollama backend [PID %%d]
    taskkill /PID %%d /F >nul 2>&1
)

REM Optional: Kill stray node.exe processes with "ShippoBot" window title (fallback safety)
for /f "tokens=2 delims=," %%e in ('tasklist /v /fo csv ^| findstr /i "node" ^| findstr /i "ShippoBot"') do (
    echo 💀 Terminating extra node window [PID %%e]
    taskkill /PID %%e /F >nul 2>&1
)

echo ✅ ShippoBot shutdown complete.
pause >nul
