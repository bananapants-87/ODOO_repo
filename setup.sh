#!/bin/bash

# FleetFlow Setup Script

set -e  # Exit on error

echo "======================================"
echo "FleetFlow - Initial Setup"
echo "======================================"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

echo "✓ Python found: $(python3 --version)"

# Navigate to backend
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo ""
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
else
    echo "✓ Virtual environment already exists"
fi

# Activate virtual environment
echo ""
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo ""
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
echo "✓ Dependencies installed"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo "✓ .env file created (please update with your settings)"
else
    echo "✓ .env file already exists"
fi

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
python manage.py makemigrations
python manage.py migrate
echo "✓ Database migrations completed"

# Create superuser
echo ""
echo "👤 Create superuser account"
python manage.py createsuperuser

# Collect static files
echo ""
echo "📦 Collecting static files..."
python manage.py collectstatic --noinput
echo "✓ Static files collected"

echo ""
echo "======================================"
echo "✅ Setup Complete!"
echo "======================================"
echo ""
echo "To start the development server, run:"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  python manage.py runserver"
echo ""
echo "Access the application:"
echo "  Backend API: http://localhost:8000/api/"
echo "  Admin Panel: http://localhost:8000/admin/"
echo "  Frontend: See frontend/index.html"
echo ""
