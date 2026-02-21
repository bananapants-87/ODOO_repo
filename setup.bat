@echo off
REM FleetFlow Setup Script for Windows

echo ======================================
echo FleetFlow - Initial Setup (Windows)
echo ======================================

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is required but not installed.
    exit /b 1
)

echo Python found: 
python --version

REM Navigate to backend
cd backend

REM Create virtual environment
if not exist "venv" (
    echo.
    echo Creating virtual environment...
    python -m venv venv
    echo Virtual environment created
) else (
    echo Virtual environment already exists
)

REM Activate virtual environment
echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo.
echo Installing dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt
echo Dependencies installed

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo.
    echo Creating .env file...
    copy .env.example .env
    echo .env file created (please update with your settings)
) else (
    echo .env file already exists
)

REM Run migrations
echo.
echo Running database migrations...
python manage.py makemigrations
python manage.py migrate
echo Database migrations completed

REM Create superuser
echo.
echo Create superuser account
python manage.py createsuperuser

REM Collect static files
echo.
echo Collecting static files...
python manage.py collectstatic --noinput
echo Static files collected

echo.
echo ======================================
echo Setup Complete!
echo ======================================
echo.
echo To start the development server, run:
echo   cd backend
echo   venv\Scripts\activate.bat
echo   python manage.py runserver
echo.
echo Access the application:
echo   Backend API: http://localhost:8000/api/
echo   Admin Panel: http://localhost:8000/admin/
echo   Frontend: See frontend/index.html
echo.
pause
