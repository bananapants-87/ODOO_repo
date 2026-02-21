from rest_framework import serializers
from .models import Fleet, FleetVehicleAssignment, FleetDriverAssignment, FleetPerformanceMetrics


class FleetPerformanceMetricsSerializer(serializers.ModelSerializer):
    avg_fuel_consumption = serializers.SerializerMethodField()

    class Meta:
        model = FleetPerformanceMetrics
        fields = '__all__'

    def get_avg_fuel_consumption(self, obj):
        return obj.get_avg_fuel_consumption()


class FleetVehicleAssignmentSerializer(serializers.ModelSerializer):
    vehicle_info = serializers.SerializerMethodField()

    class Meta:
        model = FleetVehicleAssignment
        fields = '__all__'

    def get_vehicle_info(self, obj):
        return f"{obj.vehicle.make} {obj.vehicle.model} ({obj.vehicle.license_plate})"


class FleetDriverAssignmentSerializer(serializers.ModelSerializer):
    driver_info = serializers.SerializerMethodField()

    class Meta:
        model = FleetDriverAssignment
        fields = '__all__'

    def get_driver_info(self, obj):
        return obj.driver.name


class FleetSerializer(serializers.ModelSerializer):
    vehicle_assignments = FleetVehicleAssignmentSerializer(many=True, read_only=True)
    driver_assignments = FleetDriverAssignmentSerializer(many=True, read_only=True)
    performance_metrics = FleetPerformanceMetricsSerializer(read_only=True)
    active_vehicles_count = serializers.SerializerMethodField()
    active_drivers_count = serializers.SerializerMethodField()

    class Meta:
        model = Fleet
        fields = [
            'id', 'name', 'description', 'status', 'headquarters',
            'manager_name', 'manager_email', 'manager_phone',
            'total_vehicles', 'total_drivers', 'active_vehicles_count',
            'active_drivers_count', 'vehicle_assignments', 'driver_assignments',
            'performance_metrics', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_active_vehicles_count(self, obj):
        return obj.get_active_vehicles_count()

    def get_active_drivers_count(self, obj):
        return obj.get_active_drivers_count()


class FleetListSerializer(serializers.ModelSerializer):
    active_vehicles_count = serializers.SerializerMethodField()
    active_drivers_count = serializers.SerializerMethodField()

    class Meta:
        model = Fleet
        fields = [
            'id', 'name', 'status', 'total_vehicles', 'total_drivers',
            'active_vehicles_count', 'active_drivers_count', 'created_at'
        ]

    def get_active_vehicles_count(self, obj):
        return obj.get_active_vehicles_count()

    def get_active_drivers_count(self, obj):
        return obj.get_active_drivers_count()
