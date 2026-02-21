from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Location, DocumentType, SystemLog
from .serializers import LocationSerializer, DocumentTypeSerializer, SystemLogSerializer


class LocationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing locations.
    """
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['city', 'country']
    search_fields = ['name', 'city', 'address']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class DocumentTypeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing document types.
    """
    queryset = DocumentType.objects.all()
    serializer_class = DocumentTypeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['name', 'description']
    ordering = ['name']


class SystemLogViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing system logs.
    """
    queryset = SystemLog.objects.all()
    serializer_class = SystemLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['level', 'action']
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']
    http_method_names = ['get', 'head', 'options']  # Read-only


class HealthViewSet(viewsets.ViewSet):
    """
    Health check endpoint for monitoring.
    """
    permission_classes = []  # Allow unauthenticated access

    @action(detail=False, methods=['get'])
    def check(self, request):
        """Health check endpoint"""
        return Response({
            'status': 'healthy',
            'message': 'FleetFlow API is running'
        })

    @action(detail=False, methods=['get'])
    def version(self, request):
        """Get API version"""
        return Response({
            'version': '1.0.0',
            'name': 'FleetFlow',
            'description': 'Fleet & Logistics Management System'
        })
