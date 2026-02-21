from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Fleet, FleetVehicleAssignment, FleetDriverAssignment, FleetPerformanceMetrics
from .serializers import FleetSerializer, FleetListSerializer, FleetVehicleAssignmentSerializer, FleetDriverAssignmentSerializer


class FleetViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing fleets.
    """
    queryset = Fleet.objects.all()
    serializer_class = FleetSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['name', 'manager_name', 'headquarters']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return FleetListSerializer
        return FleetSerializer

    @action(detail=True, methods=['post'])
    def assign_vehicle(self, request, pk=None):
        """Assign a vehicle to fleet"""
        fleet = self.get_object()
        vehicle_id = request.data.get('vehicle_id')
        
        if not vehicle_id:
            return Response({'error': 'vehicle_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            assignment = FleetVehicleAssignment.objects.create(
                fleet=fleet,
                vehicle_id=vehicle_id
            )
            serializer = FleetVehicleAssignmentSerializer(assignment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def assign_driver(self, request, pk=None):
        """Assign a driver to fleet"""
        fleet = self.get_object()
        driver_id = request.data.get('driver_id')
        
        if not driver_id:
            return Response({'error': 'driver_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            assignment = FleetDriverAssignment.objects.create(
                fleet=fleet,
                driver_id=driver_id
            )
            serializer = FleetDriverAssignmentSerializer(assignment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def metrics(self, request, pk=None):
        """Get performance metrics for fleet"""
        fleet = self.get_object()
        metrics = fleet.performance_metrics
        from .serializers import FleetPerformanceMetricsSerializer
        serializer = FleetPerformanceMetricsSerializer(metrics)
        return Response(serializer.data)
