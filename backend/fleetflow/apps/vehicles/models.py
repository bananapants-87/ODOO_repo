from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone


class Vehicle(models.Model):
    """
    Vehicle model to store information about fleet vehicles.
    """
    VEHICLE_STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('maintenance', 'Under Maintenance'),
        ('retired', 'Retired'),
    ]

    VEHICLE_TYPE_CHOICES = [
        ('truck', 'Truck'),
        ('van', 'Van'),
        ('car', 'Car'),
        ('motorcycle', 'Motorcycle'),
        ('trailer', 'Trailer'),
    ]

    # Basic Information
    license_plate = models.CharField(max_length=20, unique=True, db_index=True)
    vin = models.CharField(max_length=50, unique=True, db_index=True, null=True, blank=True)
    make = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1900)])
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPE_CHOICES, default='truck')

    # Specifications
    color = models.CharField(max_length=50, null=True, blank=True)
    capacity = models.DecimalField(max_digits=10, decimal_places=2, help_text="Weight capacity in kg", validators=[MinValueValidator(0)])
    fuel_type = models.CharField(max_length=20, choices=[('petrol', 'Petrol'), ('diesel', 'Diesel'), ('electric', 'Electric'), ('hybrid', 'Hybrid')], default='diesel')
    transmission = models.CharField(max_length=20, choices=[('manual', 'Manual'), ('automatic', 'Automatic')], default='automatic')

    # Status Information
    status = models.CharField(max_length=20, choices=VEHICLE_STATUS_CHOICES, default='active', db_index=True)
    odometer_reading = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])

    # Assignment
    assigned_driver = models.ForeignKey('drivers.Driver', on_delete=models.SET_NULL, null=True, blank=True, related_name='vehicles')

    # Timestamps
    registration_date = models.DateField(null=True, blank=True)
    last_service_date = models.DateField(null=True, blank=True)
    insurance_expiry = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'vehicles'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['license_plate']),
        ]

    def __str__(self):
        return f"{self.make} {self.model} ({self.license_plate})"

    def is_available(self):
        """Check if vehicle is available for use"""
        return self.status == 'active' and self.assigned_driver is None

    def get_vehicle_age(self):
        """Calculate vehicle age in years"""
        if self.year:
            return timezone.now().year - self.year
        return None


class VehicleMaintenanceLog(models.Model):
    """
    Track vehicle maintenance history.
    """
    MAINTENANCE_TYPE_CHOICES = [
        ('oil_change', 'Oil Change'),
        ('tire_rotation', 'Tire Rotation'),
        ('brake_service', 'Brake Service'),
        ('inspection', 'General Inspection'),
        ('repair', 'Repair'),
        ('other', 'Other'),
    ]

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='maintenance_logs')
    maintenance_type = models.CharField(max_length=50, choices=MAINTENANCE_TYPE_CHOICES)
    description = models.TextField()
    cost = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    maintenance_date = models.DateField()
    next_service_date = models.DateField(null=True, blank=True)
    performed_by = models.CharField(max_length=200, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'vehicle_maintenance_logs'
        ordering = ['-maintenance_date']

    def __str__(self):
        return f"{self.vehicle.license_plate} - {self.get_maintenance_type_display()} on {self.maintenance_date}"


class VehicleFuelLog(models.Model):
    """
    Track fuel consumption and refueling details.
    """
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='fuel_logs')
    fuel_amount = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)], help_text="Fuel amount in liters")
    cost = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    odometer_reading = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    fuel_date = models.DateField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'vehicle_fuel_logs'
        ordering = ['-fuel_date']

    def __str__(self):
        return f"{self.vehicle.license_plate} - {self.fuel_amount}L on {self.fuel_date}"

    def get_fuel_consumption(self):
        """Calculate fuel consumption (L/km)"""
        # This would need to compare with previous fuel log
        return None
