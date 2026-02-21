from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Driver, DriverViolation, DriverTraining
from .serializers import DriverSerializer, DriverListSerializer, DriverViolationSerializer, DriverTrainingSerializer


class DriverViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing drivers.
    
    Available endpoints:
    - GET /api/drivers/ - List all drivers
    - GET /api/drivers/{id}/ - Get driver details
    - POST /api/drivers/ - Create new driver
    - PUT /api/drivers/{id}/ - Update driver
    - DELETE /api/drivers/{id}/ - Delete driver
    - GET /api/drivers/available/ - Get available drivers
    """
    queryset = Driver.objects.all()
    serializer_class = DriverSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'license_status', 'license_class']
    search_fields = ['name', 'email', 'license_number', 'phone_number']
    ordering_fields = ['created_at', 'name', 'license_expiry_date']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return DriverListSerializer
        return DriverSerializer

    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get all available drivers"""
        available_drivers = self.queryset.filter(status='active', license_status='valid')
        serializer = DriverSerializer(available_drivers, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_violation(self, request, pk=None):
        """Add violation record for driver"""
        driver = self.get_object()
        serializer = DriverViolationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(driver=driver)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def add_training(self, request, pk=None):
        """Add training record for driver"""
        driver = self.get_object()
        serializer = DriverTrainingSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(driver=driver)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def violations(self, request, pk=None):
        """Get all violations for a driver"""
        driver = self.get_object()
        violations = driver.violations.all()
        serializer = DriverViolationSerializer(violations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def trainings(self, request, pk=None):
        """Get all trainings for a driver"""
        driver = self.get_object()
        trainings = driver.trainings.all()
        serializer = DriverTrainingSerializer(trainings, many=True)
        return Response(serializer.data)


class DriverViolationViewSet(viewsets.ModelViewSet):
    """ViewSet for driver violations"""
    queryset = DriverViolation.objects.all()
    serializer_class = DriverViolationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['driver', 'violation_type', 'severity', 'is_resolved']
    ordering_fields = ['violation_date', 'created_at']
    ordering = ['-violation_date']


class DriverTrainingViewSet(viewsets.ModelViewSet):
    """ViewSet for driver training records"""
    queryset = DriverTraining.objects.all()
    serializer_class = DriverTrainingSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['driver', 'training_type']
    ordering_fields = ['training_date', 'expiry_date']
    ordering = ['-training_date']
