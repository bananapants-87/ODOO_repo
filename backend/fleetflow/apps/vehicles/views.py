from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Vehicle, VehicleMaintenanceLog, VehicleFuelLog
from .serializers import VehicleSerializer, VehicleListSerializer, VehicleMaintenanceLogSerializer, VehicleFuelLogSerializer


class VehicleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing vehicles.
    
    Available endpoints:
    - GET /api/vehicles/ - List all vehicles
    - GET /api/vehicles/{id}/ - Get vehicle details
    - POST /api/vehicles/ - Create new vehicle
    - PUT /api/vehicles/{id}/ - Update vehicle
    - DELETE /api/vehicles/{id}/ - Delete vehicle
    - GET /api/vehicles/available/ - Get available vehicles
    - POST /api/vehicles/{id}/add_fuel_log/ - Add fuel log
    - POST /api/vehicles/{id}/add_maintenance_log/ - Add maintenance log
    """
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'vehicle_type', 'fuel_type']
    search_fields = ['license_plate', 'make', 'model', 'vin']
    ordering_fields = ['created_at', 'license_plate', 'capacity']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return VehicleListSerializer
        return VehicleSerializer

    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get all available vehicles"""
        available_vehicles = self.queryset.filter(status='active', assigned_driver__isnull=True)
        serializer = VehicleSerializer(available_vehicles, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_fuel_log(self, request, pk=None):
        """Add fuel log for a vehicle"""
        vehicle = self.get_object()
        serializer = VehicleFuelLogSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(vehicle=vehicle)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def add_maintenance_log(self, request, pk=None):
        """Add maintenance log for a vehicle"""
        vehicle = self.get_object()
        serializer = VehicleMaintenanceLogSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(vehicle=vehicle)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def maintenance_history(self, request, pk=None):
        """Get maintenance history for a vehicle"""
        vehicle = self.get_object()
        maintenance_logs = vehicle.maintenance_logs.all()
        serializer = VehicleMaintenanceLogSerializer(maintenance_logs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def fuel_history(self, request, pk=None):
        """Get fuel history for a vehicle"""
        vehicle = self.get_object()
        fuel_logs = vehicle.fuel_logs.all()
        serializer = VehicleFuelLogSerializer(fuel_logs, many=True)
        return Response(serializer.data)


class VehicleMaintenanceLogViewSet(viewsets.ModelViewSet):
    """ViewSet for vehicle maintenance logs"""
    queryset = VehicleMaintenanceLog.objects.all()
    serializer_class = VehicleMaintenanceLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['vehicle', 'maintenance_type']
    ordering_fields = ['maintenance_date', 'created_at']
    ordering = ['-maintenance_date']


class VehicleFuelLogViewSet(viewsets.ModelViewSet):
    """ViewSet for vehicle fuel logs"""
    queryset = VehicleFuelLog.objects.all()
    serializer_class = VehicleFuelLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['vehicle']
    ordering_fields = ['fuel_date', 'created_at']
    ordering = ['-fuel_date']
