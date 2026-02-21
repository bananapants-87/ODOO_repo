from django.db import models
from django.core.validators import MinValueValidator


class Fleet(models.Model):
    """
    Fleet model to group and manage vehicles.
    """
    FLEET_STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('archived', 'Archived'),
    ]

    name = models.CharField(max_length=200, unique=True, db_index=True)
    description = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=FLEET_STATUS_CHOICES, default='active', db_index=True)
    
    # Fleet Information
    headquarters = models.CharField(max_length=300, null=True, blank=True)
    manager_name = models.CharField(max_length=200, null=True, blank=True)
    manager_email = models.EmailField(null=True, blank=True)
    manager_phone = models.CharField(max_length=20, null=True, blank=True)

    # Statistics
    total_vehicles = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    total_drivers = models.IntegerField(default=0, validators=[MinValueValidator(0)])

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'fleets'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def get_active_vehicles_count(self):
        """Get count of active vehicles in fleet"""
        return self.vehicles.filter(status='active').count()

    def get_active_drivers_count(self):
        """Get count of active drivers in fleet"""
        return self.drivers.filter(status='active').count()


class FleetVehicleAssignment(models.Model):
    """
    Track vehicle assignments to fleet.
    """
    fleet = models.ForeignKey(Fleet, on_delete=models.CASCADE, related_name='vehicle_assignments')
    vehicle = models.ForeignKey('vehicles.Vehicle', on_delete=models.CASCADE, related_name='fleet_assignments')
    assignment_date = models.DateField(auto_now_add=True)
    removal_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'fleet_vehicle_assignments'
        unique_together = [['fleet', 'vehicle']]
        ordering = ['-assignment_date']

    def __str__(self):
        return f"{self.fleet.name} - {self.vehicle.license_plate}"


class FleetDriverAssignment(models.Model):
    """
    Track driver assignments to fleet.
    """
    fleet = models.ForeignKey(Fleet, on_delete=models.CASCADE, related_name='driver_assignments')
    driver = models.ForeignKey('drivers.Driver', on_delete=models.CASCADE, related_name='fleet_assignments')
    assignment_date = models.DateField(auto_now_add=True)
    removal_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'fleet_driver_assignments'
        unique_together = [['fleet', 'driver']]
        ordering = ['-assignment_date']

    def __str__(self):
        return f"{self.fleet.name} - {self.driver.name}"


class FleetPerformanceMetrics(models.Model):
    """
    Track fleet performance metrics.
    """
    fleet = models.OneToOneField(Fleet, on_delete=models.CASCADE, related_name='performance_metrics')
    
    # Operating metrics
    total_trips = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    total_km_traveled = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    total_fuel_consumed = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    
    # Financial metrics
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    total_fuel_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    total_maintenance_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    
    # Safety metrics
    total_violations = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    total_accidents = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    safety_rating = models.DecimalField(max_digits=3, decimal_places=2, default=5, validators=[MinValueValidator(0)])

    # Efficiency metrics
    average_utilization_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    on_time_delivery_rate = models.DecimalField(max_digits=5, decimal_places=2, default=100, validators=[MinValueValidator(0)])

    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'fleet_performance_metrics'

    def __str__(self):
        return f"Metrics for {self.fleet.name}"

    def get_avg_fuel_consumption(self):
        """Calculate average fuel consumption (L/km)"""
        if self.total_km_traveled > 0:
            return self.total_fuel_consumed / self.total_km_traveled
        return 0
