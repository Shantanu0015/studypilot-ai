@echo off
title AI Study Planner
color 0A

set "ROOT=C:\Users\shant\OneDrive\Desktop\ai-study-planner-st"
set "PYTHON=%ROOT%\backend\venv\Scripts\python.exe"

echo.
echo  ====================================
echo    AI Study Planner - Starting Up
echo  ====================================
echo.

echo  [1/3] Starting Flask backend (port 5000)...
start "Flask Backend" /MIN "%PYTHON%" "%ROOT%\backend\app.py"

echo  [2/3] Waiting 4 seconds for backend...
timeout /t 4 /nobreak >nul

echo  [3/3] Starting frontend (port 8000)...
start "Frontend" /MIN "%PYTHON%" -m http.server 8000 --directory "%ROOT%\frontend"

timeout /t 2 /nobreak >nul

echo.
echo  ====================================
echo    App is ready!
echo  ====================================
echo.
echo   Open : http://127.0.0.1:8000
echo.
start "" "http://127.0.0.1:8000"

echo  Press any key to STOP both servers.
pause >nul

echo  Stopping servers...
taskkill /FI "WINDOWTITLE eq Flask Backend" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend" /F >nul 2>&1
echo  Done!
