@echo off
REM YOLOE Vision Platform - Launcher
REM Sets up environment and starts the backend server

set "PYTHON=F:\mambaforge\python.exe"
set "VENV=%~dp0venv"
set "PYTHONPATH=%VENV%\Lib\site-packages;%PYTHONPATH%"

echo ================================================
echo YOLOE Vision Platform - YOLOE-26 Backend
echo ================================================
echo.

REM Check Python
"%PYTHON%" --version
if errorlevel 1 (
    echo ERROR: Python not found at %PYTHON%
    pause
    exit /b 1
)

REM Check ultralytics
"%PYTHON%" -c "import ultralytics; print('ultralytics:', ultralytics.__version__)" 2>nul
if errorlevel 1 (
    echo WARNING: ultralytics not installed
    echo Install with: pip install ultralytics
    echo Starting in mock mode...
    set "MOCK_MODE=1"
)

REM Start the server
echo.
echo Starting server at http://localhost:8000 ...
echo.
cd /d "%~dp0"
"%PYTHON%" -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
