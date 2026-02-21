from django.contrib import admin
from .models import Shipment, ShipmentTracking, DeliveryRoute, Invoice


@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ['shipment_id', 'status', 'origin', 'destination', 'assigned_vehicle', 'assigned_driver', 'created_date']
    list_filter = ['status', 'priority', 'created_date']
    search_fields = ['shipment_id', 'origin', 'destination']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ShipmentTracking)
class ShipmentTrackingAdmin(admin.ModelAdmin):
    list_display = ['shipment', 'status', 'latitude', 'longitude', 'timestamp']
    list_filter = ['status', 'timestamp']
    search_fields = ['shipment__shipment_id']


@admin.register(DeliveryRoute)
class DeliveryRouteAdmin(admin.ModelAdmin):
    list_display = ['shipment', 'stop_number', 'location', 'scheduled_arrival']
    list_filter = ['stop_number', 'scheduled_arrival']
    search_fields = ['shipment__shipment_id', 'location']


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'shipment', 'status', 'total_amount', 'issued_date', 'due_date']
    list_filter = ['status', 'issued_date', 'due_date']
    search_fields = ['invoice_number', 'shipment__shipment_id']
    readonly_fields = ['created_at', 'updated_at']
