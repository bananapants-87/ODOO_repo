# Quick Start Guide - FleetFlow

## 🚀 Getting Started in 5 Minutes

### Prerequisites
- Python 3.11+ installed
- PostgreSQL installed and running (or use Docker)
- Git

### Step 1: Setup Backend

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Configure Database

```bash
# Copy environment file
cp .env.example .env

# Edit .env with your database credentials (optional, defaults work for local dev)
nano .env  # or use your preferred editor
```

### Step 3: Initialize Database

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser account
python manage.py createsuperuser
# Follow prompts to create admin user
```

### Step 4: Run Development Server

```bash
python manage.py runserver
```

Server will start at http://localhost:8000

### Step 5: Access the Application

- **Admin Dashboard**: http://localhost:8000/admin/
  - Login with superuser credentials
  - Manage all data from here

- **API Documentation**: http://localhost:8000/api/
  - Browse REST API endpoints

- **Frontend**: Open `frontend/index.html` in browser
  - Configure API endpoint in settings
  - Dashboard with vehicle, driver, fleet, and logistics management

## 📊 Using the Admin Dashboard

1. Go to http://localhost:8000/admin/
2. Login with superuser credentials
3. Create test data:
   - Add a Fleet
   - Add Vehicles
   - Add Drivers
   - Create Shipments

## 🔌 Using the API

All API endpoints require authentication. First, login via Django admin or get a session token.

### Example API Calls

```bash
# Get all vehicles
curl -H "Authorization: Session YOUR_TOKEN" \
  http://localhost:8000/api/vehicles/

# Get available vehicles
curl -H "Authorization: Session YOUR_TOKEN" \
  http://localhost:8000/api/vehicles/available/

# Create a new vehicle
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"license_plate":"ABC123","make":"Toyota","model":"Hiace","capacity":2000}' \
  http://localhost:8000/api/vehicles/

# Health check (no auth required)
curl http://localhost:8000/api/health/check/
```

## 🐳 Using Docker

```bash
# Build and start services
docker-compose up -d

# Check if services are running
docker-compose ps

# View logs
docker-compose logs -f backend

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Stop services
docker-compose down
```

## 🔧 Project Structure

- `frontend/index.html` - Single-file frontend application
- `backend/fleetflow/apps/vehicles/` - Vehicle management module
- `backend/fleetflow/apps/drivers/` - Driver management module
- `backend/fleetflow/apps/fleet/` - Fleet management module
- `backend/fleetflow/apps/logistics/` - Logistics and shipments module
- `backend/fleetflow/apps/common/` - Shared utilities and helpers

## 📝 Common Commands

```bash
# Create migrations for model changes
python manage.py makemigrations app_name

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Access Django shell
python manage.py shell

# Collect static files (production)
python manage.py collectstatic

# Run tests
python manage.py test

# Reset database (development only!)
python manage.py flush

# Export data
python manage.py dumpdata > data.json

# Import data
python manage.py loaddata data.json
```

## 🐛 Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running
- Check credentials in `.env`
- Try: `psql -U postgres -h localhost -d fleetflow_db`

### Port 8000 Already in Use
```bash
# Use different port
python manage.py runserver 8001
```

### Import Errors
```bash
# Reinstall dependencies
pip install --force-reinstall -r requirements.txt
```

### Permission Denied on manage.py
```bash
# Make executable (Linux/Mac)
chmod +x manage.py
```

## 📚 Next Steps

1. **Explore Admin Dashboard** - Create test data
2. **Review API Documentation** - Test endpoints in browser
3. **Customize Frontend** - Update `frontend/index.html` with your design
4. **Integrate with External Services**:
   - Maps API for tracking
   - Email service for notifications
   - SMS for alerts
5. **Deploy to Production**:
   - Update SECRET_KEY in `.env`
   - Set DEBUG=False
   - Configure allowed hosts
   - Use environment variables for sensitive data
   - Deploy with Gunicorn + Nginx
   - Use managed PostgreSQL service

## 🆘 Need Help?

- Check `README.md` for detailed documentation
- Review API endpoint specifications
- Check Django logs: `logs/fleetflow.log`
- Use Django shell for testing

---

**Happy coding! 🎉**
