from django.contrib import admin
from .models import Vehicle, VehicleMaintenanceLog, VehicleFuelLog


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ['license_plate', 'make', 'model', 'status', 'assigned_driver', 'created_at']
    list_filter = ['status', 'vehicle_type', 'fuel_type', 'created_at']
    search_fields = ['license_plate', 'vin', 'make', 'model']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('license_plate', 'vin', 'make', 'model', 'year', 'vehicle_type')
        }),
        ('Specifications', {
            'fields': ('color', 'capacity', 'fuel_type', 'transmission')
        }),
        ('Status', {
            'fields': ('status', 'odometer_reading', 'assigned_driver')
        }),
        ('Dates', {
            'fields': ('registration_date', 'last_service_date', 'insurance_expiry')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(VehicleMaintenanceLog)
class VehicleMaintenanceLogAdmin(admin.ModelAdmin):
    list_display = ['vehicle', 'maintenance_type', 'maintenance_date', 'cost', 'performed_by']
    list_filter = ['maintenance_type', 'maintenance_date', 'vehicle']
    search_fields = ['vehicle__license_plate', 'description', 'performed_by']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(VehicleFuelLog)
class VehicleFuelLogAdmin(admin.ModelAdmin):
    list_display = ['vehicle', 'fuel_amount', 'cost', 'fuel_date', 'odometer_reading']
    list_filter = ['fuel_date', 'vehicle']
    search_fields = ['vehicle__license_plate']
    readonly_fields = ['created_at', 'updated_at']
