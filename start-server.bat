@echo off
echo 🚀 Starting EduQuest Development Server...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found! Please install Python from https://python.org
    echo 📖 Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)

echo ✅ Python found!
echo 📡 Starting server on http://localhost:8000

REM Start the Python server
python serve.py

pause