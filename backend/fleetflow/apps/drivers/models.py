from django.db import models
from django.core.validators import MinValueValidator, RegexValidator
from django.utils import timezone


class Driver(models.Model):
    """
    Driver model to store driver information.
    """
    DRIVER_STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('on_leave', 'On Leave'),
        ('terminated', 'Terminated'),
    ]

    LICENSE_STATUS_CHOICES = [
        ('valid', 'Valid'),
        ('expired', 'Expired'),
        ('suspended', 'Suspended'),
    ]

    # Personal Information
    name = models.CharField(max_length=200, db_index=True)
    email = models.EmailField(unique=True, db_index=True)
    phone = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message='Phone number must be entered in the format: +999999999'
    )
    phone_number = models.CharField(max_length=20, validators=[phone])
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    postal_code = models.CharField(max_length=20, null=True, blank=True)
    nationality = models.CharField(max_length=100, null=True, blank=True)

    # License Information
    license_number = models.CharField(max_length=50, unique=True, db_index=True)
    license_class = models.CharField(max_length=20, choices=[
        ('a', 'Class A'),
        ('b', 'Class B'),
        ('c', 'Class C'),
        ('d', 'Class D'),
        ('e', 'Class E'),
    ], default='b')
    license_issue_date = models.DateField()
    license_expiry_date = models.DateField(db_index=True)
    license_status = models.CharField(max_length=20, choices=LICENSE_STATUS_CHOICES, default='valid')

    # Employment Information
    employment_date = models.DateField()
    status = models.CharField(max_length=20, choices=DRIVER_STATUS_CHOICES, default='active', db_index=True)
    hourly_rate = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    
    # Medical/Safety Information
    medical_cert_expiry = models.DateField(null=True, blank=True)
    training_cert_expiry = models.DateField(null=True, blank=True)
    background_check_date = models.DateField(null=True, blank=True)
    background_check_status = models.BooleanField(default=False)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'drivers'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['license_number']),
        ]

    def __str__(self):
        return f"{self.name} ({self.license_number})"

    def is_license_valid(self):
        """Check if driver's license is valid"""
        if self.license_status != 'valid':
            return False
        return self.license_expiry_date > timezone.now().date()

    def is_available(self):
        """Check if driver is available for assignment"""
        return self.status == 'active' and self.is_license_valid()

    def get_age(self):
        """Calculate driver age"""
        if self.date_of_birth:
            today = timezone.now().date()
            return today.year - self.date_of_birth.year - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))
        return None


class DriverViolation(models.Model):
    """
    Track traffic violations and incidents.
    """
    VIOLATION_TYPE_CHOICES = [
        ('speeding', 'Speeding'),
        ('traffic_light', 'Traffic Light Violation'),
        ('unsafe_driving', 'Unsafe Driving'),
        ('parking', 'Parking Violation'),
        ('accident', 'Accident'),
        ('other', 'Other'),
    ]

    SEVERITY_CHOICES = [
        ('minor', 'Minor'),
        ('moderate', 'Moderate'),
        ('major', 'Major'),
    ]

    driver = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name='violations')
    violation_type = models.CharField(max_length=50, choices=VIOLATION_TYPE_CHOICES)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    description = models.TextField()
    violation_date = models.DateField(db_index=True)
    location = models.CharField(max_length=300)
    fine_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    is_resolved = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'driver_violations'
        ordering = ['-violation_date']

    def __str__(self):
        return f"{self.driver.name} - {self.get_violation_type_display()} on {self.violation_date}"


class DriverTraining(models.Model):
    """
    Track driver training and certifications.
    """
    TRAINING_TYPE_CHOICES = [
        ('safety', 'Safety Training'),
        ('defensive_driving', 'Defensive Driving'),
        ('hazmat', 'Hazardous Materials'),
        ('passenger', 'Passenger Transport'),
        ('cargo', 'Cargo Handling'),
        ('other', 'Other'),
    ]

    driver = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name='trainings')
    training_type = models.CharField(max_length=50, choices=TRAINING_TYPE_CHOICES)
    training_date = models.DateField()
    expiry_date = models.DateField()
    provider = models.CharField(max_length=200)
    certificate_number = models.CharField(max_length=100, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'driver_trainings'
        ordering = ['-training_date']

    def __str__(self):
        return f"{self.driver.name} - {self.get_training_type_display()}"

    def is_valid(self):
        """Check if training certification is still valid"""
        return self.expiry_date > timezone.now().date()
