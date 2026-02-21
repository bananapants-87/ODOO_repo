from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone

from .models import Shipment, ShipmentTracking, DeliveryRoute, Invoice
from .serializers import ShipmentSerializer, ShipmentListSerializer, ShipmentTrackingSerializer, DeliveryRouteSerializer, InvoiceSerializer


class ShipmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing shipments.
    
    Available endpoints:
    - GET /api/shipments/ - List all shipments
    - GET /api/shipments/{id}/ - Get shipment details
    - POST /api/shipments/ - Create new shipment
    - PUT /api/shipments/{id}/ - Update shipment
    - DELETE /api/shipments/{id}/ - Delete shipment
    """
    queryset = Shipment.objects.all()
    serializer_class = ShipmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'priority']
    search_fields = ['shipment_id', 'origin', 'destination']
    ordering_fields = ['created_date', 'scheduled_delivery', 'priority']
    ordering = ['-created_date']

    def get_serializer_class(self):
        if self.action == 'list':
            return ShipmentListSerializer
        return ShipmentSerializer

    @action(detail=True, methods=['post'])
    def assign_vehicle_driver(self, request, pk=None):
        """Assign vehicle and driver to shipment"""
        shipment = self.get_object()
        vehicle_id = request.data.get('vehicle_id')
        driver_id = request.data.get('driver_id')

        if not vehicle_id or not driver_id:
            return Response(
                {'error': 'vehicle_id and driver_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        shipment.assigned_vehicle_id = vehicle_id
        shipment.assigned_driver_id = driver_id
        shipment.status = 'assigned'
        shipment.save()

        serializer = ShipmentSerializer(shipment)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def start_transit(self, request, pk=None):
        """Mark shipment as in transit"""
        shipment = self.get_object()
        shipment.status = 'in_transit'
        shipment.actual_pickup = timezone.now()
        shipment.save()

        serializer = ShipmentSerializer(shipment)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def complete_delivery(self, request, pk=None):
        """Mark shipment as delivered"""
        shipment = self.get_object()
        shipment.status = 'delivered'
        shipment.actual_delivery = timezone.now()
        shipment.save()

        serializer = ShipmentSerializer(shipment)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def tracking_history(self, request, pk=None):
        """Get tracking history for shipment"""
        shipment = self.get_object()
        tracking = shipment.tracking_events.all()
        serializer = ShipmentTrackingSerializer(tracking, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def update_tracking(self, request, pk=None):
        """Add tracking update for shipment"""
        shipment = self.get_object()
        serializer = ShipmentTrackingSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(shipment=shipment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ShipmentTrackingViewSet(viewsets.ModelViewSet):
    """ViewSet for shipment tracking events"""
    queryset = ShipmentTracking.objects.all()
    serializer_class = ShipmentTrackingSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['shipment', 'status']
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']


class DeliveryRouteViewSet(viewsets.ModelViewSet):
    """ViewSet for delivery routes"""
    queryset = DeliveryRoute.objects.all()
    serializer_class = DeliveryRouteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['shipment']
    ordering_fields = ['stop_number']
    ordering = ['shipment', 'stop_number']


class InvoiceViewSet(viewsets.ModelViewSet):
    """ViewSet for invoices"""
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['invoice_number', 'shipment__shipment_id']
    ordering_fields = ['issued_date', 'due_date']
    ordering = ['-issued_date']
