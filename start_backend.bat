@echo off
echo.
echo ╔══════════════════════════════════════════════╗
echo ║  FaceAI Attendance System - Backend Startup  ║
echo ╚══════════════════════════════════════════════╝
echo.

cd /d "%~dp0backend"

echo [1/2] Installing Python dependencies...
pip install -r requirements.txt

echo.
echo [2/2] Starting FastAPI backend on http://localhost:8000
echo Swagger UI: http://localhost:8000/docs
echo.
uvicorn main:app --reload --port 8000

pause
