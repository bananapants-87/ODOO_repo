from django.contrib import admin
from .models import Fleet, FleetVehicleAssignment, FleetDriverAssignment, FleetPerformanceMetrics


@admin.register(Fleet)
class FleetAdmin(admin.ModelAdmin):
    list_display = ['name', 'status', 'total_vehicles', 'total_drivers', 'manager_name', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['name', 'manager_name', 'headquarters']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(FleetVehicleAssignment)
class FleetVehicleAssignmentAdmin(admin.ModelAdmin):
    list_display = ['fleet', 'vehicle', 'assignment_date', 'is_active']
    list_filter = ['is_active', 'assignment_date']
    search_fields = ['fleet__name', 'vehicle__license_plate']


@admin.register(FleetDriverAssignment)
class FleetDriverAssignmentAdmin(admin.ModelAdmin):
    list_display = ['fleet', 'driver', 'assignment_date', 'is_active']
    list_filter = ['is_active', 'assignment_date']
    search_fields = ['fleet__name', 'driver__name']


@admin.register(FleetPerformanceMetrics)
class FleetPerformanceMetricsAdmin(admin.ModelAdmin):
    list_display = ['fleet', 'total_trips', 'total_km_traveled', 'safety_rating', 'last_updated']
    list_filter = ['last_updated']
    search_fields = ['fleet__name']
    readonly_fields = ['last_updated']
