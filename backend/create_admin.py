#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fleetflow.config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Check if admin user already exists
if User.objects.filter(username='admin').exists():
    print("Admin user already exists. Updating password...")
    user = User.objects.get(username='admin')
    user.set_password('admin123')
    user.save()
    print(f"✅ Admin user password updated!")
else:
    # Create new superuser
    user = User.objects.create_superuser(
        username='admin',
        email='admin@fleetflow.dev',
        password='admin123'
    )
    print(f"✅ Admin user created successfully!")
    print(f"   Username: admin")
    print(f"   Password: admin123")
    print(f"   Email: admin@fleetflow.dev")
