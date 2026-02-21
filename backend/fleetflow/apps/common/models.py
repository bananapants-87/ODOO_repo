from django.db import models
from django.core.validators import MinValueValidator


class Location(models.Model):
    """
    Store frequently used locations for shipments.
    """
    name = models.CharField(max_length=300, unique=True)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state_province = models.CharField(max_length=100, null=True, blank=True)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    
    # Contact information
    contact_name = models.CharField(max_length=200, null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'locations'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.city}, {self.country})"


class DocumentType(models.Model):
    """
    Document types that can be attached to shipments.
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(null=True, blank=True)
    is_required = models.BooleanField(default=False)
    max_size_mb = models.IntegerField(default=10, validators=[MinValueValidator(1)])

    class Meta:
        db_table = 'document_types'
        ordering = ['name']

    def __str__(self):
        return self.name


class SystemLog(models.Model):
    """
    Log important system activities.
    """
    LOG_LEVEL_CHOICES = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('critical', 'Critical'),
    ]

    action = models.CharField(max_length=200)
    level = models.CharField(max_length=20, choices=LOG_LEVEL_CHOICES)
    user = models.CharField(max_length=200, null=True, blank=True)
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'system_logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp', 'level']),
        ]

    def __str__(self):
        return f"{self.level.upper()} - {self.action} at {self.timestamp}"
