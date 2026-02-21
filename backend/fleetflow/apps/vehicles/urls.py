from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VehicleViewSet, VehicleMaintenanceLogViewSet, VehicleFuelLogViewSet

app_name = 'vehicles'

router = DefaultRouter()
router.register(r'', VehicleViewSet, basename='vehicle')
router.register(r'maintenance-logs', VehicleMaintenanceLogViewSet, basename='maintenance-log')
router.register(r'fuel-logs', VehicleFuelLogViewSet, basename='fuel-log')

urlpatterns = [
    path('', include(router.urls)),
]
