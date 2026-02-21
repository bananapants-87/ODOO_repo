from rest_framework import serializers
from .models import Shipment, ShipmentTracking, DeliveryRoute, Invoice


class ShipmentTrackingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShipmentTracking
        fields = '__all__'


class DeliveryRouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryRoute
        fields = '__all__'


class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = '__all__'


class ShipmentSerializer(serializers.ModelSerializer):
    tracking_events = ShipmentTrackingSerializer(many=True, read_only=True)
    routes = DeliveryRouteSerializer(many=True, read_only=True)
    invoice = InvoiceSerializer(read_only=True)
    vehicle_info = serializers.CharField(source='assigned_vehicle.license_plate', read_only=True)
    driver_name = serializers.CharField(source='assigned_driver.name', read_only=True)
    is_on_time = serializers.SerializerMethodField()
    duration_hours = serializers.SerializerMethodField()

    class Meta:
        model = Shipment
        fields = [
            'id', 'shipment_id', 'status', 'priority', 'origin', 'destination',
            'origin_latitude', 'origin_longitude', 'destination_latitude', 'destination_longitude',
            'cargo_description', 'cargo_weight', 'cargo_volume', 'cargo_value', 'special_handling',
            'assigned_vehicle', 'vehicle_info', 'assigned_driver', 'driver_name',
            'created_date', 'scheduled_pickup', 'scheduled_delivery',
            'actual_pickup', 'actual_delivery', 'is_on_time', 'duration_hours',
            'tracking_events', 'routes', 'invoice', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_date', 'created_at', 'updated_at']

    def get_is_on_time(self, obj):
        return obj.is_on_time()

    def get_duration_hours(self, obj):
        return obj.get_duration_hours()


class ShipmentListSerializer(serializers.ModelSerializer):
    vehicle_info = serializers.CharField(source='assigned_vehicle.license_plate', read_only=True)
    driver_name = serializers.CharField(source='assigned_driver.name', read_only=True)

    class Meta:
        model = Shipment
        fields = [
            'id', 'shipment_id', 'status', 'priority', 'origin', 'destination',
            'assigned_vehicle', 'vehicle_info', 'assigned_driver', 'driver_name',
            'scheduled_delivery', 'created_date'
        ]
