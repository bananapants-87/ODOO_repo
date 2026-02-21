FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy project
COPY . .

# Create necessary directories
RUN mkdir -p logs staticfiles media

# Expose port
EXPOSE 8000

# Run gunicorn
CMD ["gunicorn", "fleetflow.config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4"]
