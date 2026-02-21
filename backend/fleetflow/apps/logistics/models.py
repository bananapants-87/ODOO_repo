from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone


class Shipment(models.Model):
    """
    Shipment model to track cargo shipments.
    """
    SHIPMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('assigned', 'Assigned'),
        ('in_transit', 'In Transit'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('on_hold', 'On Hold'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    # Shipment Information
    shipment_id = models.CharField(max_length=50, unique=True, db_index=True)
    status = models.CharField(max_length=20, choices=SHIPMENT_STATUS_CHOICES, default='pending', db_index=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')

    # Location Information
    origin = models.CharField(max_length=300)
    destination = models.CharField(max_length=300)
    origin_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    origin_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    destination_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    destination_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    # Cargo Information
    cargo_description = models.TextField()
    cargo_weight = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], help_text="Weight in kg")
    cargo_volume = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True, validators=[MinValueValidator(0)], help_text="Volume in m³")
    cargo_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    special_handling = models.TextField(null=True, blank=True)

    # Assignment
    assigned_vehicle = models.ForeignKey('vehicles.Vehicle', on_delete=models.SET_NULL, null=True, blank=True, related_name='shipments')
    assigned_driver = models.ForeignKey('drivers.Driver', on_delete=models.SET_NULL, null=True, blank=True, related_name='shipments')

    # Dates
    created_date = models.DateField(auto_now_add=True)
    scheduled_pickup = models.DateTimeField()
    scheduled_delivery = models.DateTimeField()
    actual_pickup = models.DateTimeField(null=True, blank=True)
    actual_delivery = models.DateTimeField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'shipments'
        ordering = ['-created_date']
        indexes = [
            models.Index(fields=['status', 'created_date']),
            models.Index(fields=['shipment_id']),
        ]

    def __str__(self):
        return f"{self.shipment_id} - {self.origin} to {self.destination}"

    def is_on_time(self):
        """Check if shipment will be delivered on time"""
        if self.actual_delivery:
            return self.actual_delivery <= self.scheduled_delivery
        return timezone.now() <= self.scheduled_delivery

    def get_duration_hours(self):
        """Get duration of shipment in hours"""
        if self.actual_delivery and self.actual_pickup:
            delta = self.actual_delivery - self.actual_pickup
            return delta.total_seconds() / 3600
        return None


class ShipmentTracking(models.Model):
    """
    Track shipment location and status updates.
    """
    STATUS_CHOICES = [
        ('pending_pickup', 'Pending Pickup'),
        ('picked_up', 'Picked Up'),
        ('in_transit', 'In Transit'),
        ('in_transit_stop', 'In Transit - Stop'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('failed_delivery', 'Failed Delivery'),
    ]

    shipment = models.ForeignKey(Shipment, on_delete=models.CASCADE, related_name='tracking_events')
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES)
    notes = models.TextField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'shipment_tracking'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.shipment.shipment_id} - {self.get_status_display()} at {self.timestamp}"


class DeliveryRoute(models.Model):
    """
    Define delivery routes for multi-stop deliveries.
    """
    shipment = models.ForeignKey(Shipment, on_delete=models.CASCADE, related_name='routes')
    stop_number = models.IntegerField(validators=[MinValueValidator(1)])
    location = models.CharField(max_length=300)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    scheduled_arrival = models.DateTimeField()
    actual_arrival = models.DateTimeField(null=True, blank=True)
    
    load_weight = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    description = models.TextField()

    class Meta:
        db_table = 'delivery_routes'
        ordering = ['shipment', 'stop_number']

    def __str__(self):
        return f"{self.shipment.shipment_id} - Stop {self.stop_number}"


class Invoice(models.Model):
    """
    Invoice model for shipment billing.
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('issued', 'Issued'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]

    shipment = models.OneToOneField(Shipment, on_delete=models.CASCADE, related_name='invoice')
    invoice_number = models.CharField(max_length=50, unique=True, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    base_amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    
    issued_date = models.DateField()
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'invoices'
        ordering = ['-issued_date']

    def __str__(self):
        return f"{self.invoice_number} - {self.shipment.shipment_id}"
