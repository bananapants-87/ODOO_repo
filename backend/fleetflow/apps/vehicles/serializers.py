from rest_framework import serializers
from .models import Vehicle, VehicleMaintenanceLog, VehicleFuelLog


class VehicleMaintenanceLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleMaintenanceLog
        fields = '__all__'


class VehicleFuelLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleFuelLog
        fields = '__all__'


class VehicleSerializer(serializers.ModelSerializer):
    maintenance_logs = VehicleMaintenanceLogSerializer(many=True, read_only=True)
    fuel_logs = VehicleFuelLogSerializer(many=True, read_only=True)
    driver_name = serializers.CharField(source='assigned_driver.name', read_only=True)
    is_available = serializers.SerializerMethodField()
    vehicle_age = serializers.SerializerMethodField()

    class Meta:
        model = Vehicle
        fields = [
            'id', 'license_plate', 'vin', 'make', 'model', 'year', 'vehicle_type',
            'color', 'capacity', 'fuel_type', 'transmission', 'status',
            'odometer_reading', 'assigned_driver', 'driver_name', 'registration_date',
            'last_service_date', 'insurance_expiry', 'is_available', 'vehicle_age',
            'maintenance_logs', 'fuel_logs', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'driver_name']

    def get_is_available(self, obj):
        return obj.is_available()

    def get_vehicle_age(self, obj):
        return obj.get_vehicle_age()


class VehicleListSerializer(serializers.ModelSerializer):
    driver_name = serializers.CharField(source='assigned_driver.name', read_only=True)
    is_available = serializers.SerializerMethodField()

    class Meta:
        model = Vehicle
        fields = [
            'id', 'license_plate', 'make', 'model', 'vehicle_type',
            'status', 'assigned_driver', 'driver_name', 'is_available', 'created_at'
        ]

    def get_is_available(self, obj):
        return obj.is_available()
