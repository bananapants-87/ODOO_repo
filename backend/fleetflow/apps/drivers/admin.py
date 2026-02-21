from django.contrib import admin
from .models import Driver, DriverViolation, DriverTraining


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ['name', 'license_number', 'status', 'license_status', 'license_expiry_date', 'created_at']
    list_filter = ['status', 'license_status', 'created_at', 'employment_date']
    search_fields = ['name', 'email', 'license_number', 'phone_number']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Personal Information', {
            'fields': ('name', 'email', 'phone_number', 'date_of_birth', 'address', 'city', 'postal_code', 'nationality')
        }),
        ('License Information', {
            'fields': ('license_number', 'license_class', 'license_issue_date', 'license_expiry_date', 'license_status')
        }),
        ('Employment', {
            'fields': ('employment_date', 'status', 'hourly_rate')
        }),
        ('Certifications', {
            'fields': ('medical_cert_expiry', 'training_cert_expiry', 'background_check_date', 'background_check_status')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(DriverViolation)
class DriverViolationAdmin(admin.ModelAdmin):
    list_display = ['driver', 'violation_type', 'severity', 'violation_date', 'is_resolved']
    list_filter = ['violation_type', 'severity', 'violation_date', 'is_resolved']
    search_fields = ['driver__name', 'driver__license_number', 'location']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(DriverTraining)
class DriverTrainingAdmin(admin.ModelAdmin):
    list_display = ['driver', 'training_type', 'training_date', 'expiry_date', 'provider']
    list_filter = ['training_type', 'training_date', 'expiry_date']
    search_fields = ['driver__name', 'provider', 'certificate_number']
    readonly_fields = ['created_at', 'updated_at']
