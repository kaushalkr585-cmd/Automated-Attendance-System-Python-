@echo off
echo.
echo ╔══════════════════════════════════════════════╗
echo ║  FaceAI Attendance System - Frontend Startup ║
echo ╚══════════════════════════════════════════════╝
echo.

cd /d "%~dp0frontend"

echo Starting React dev server on http://localhost:5173
echo.
npm run dev

pause
