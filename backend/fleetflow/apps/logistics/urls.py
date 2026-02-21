from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ShipmentViewSet, ShipmentTrackingViewSet, DeliveryRouteViewSet, InvoiceViewSet

app_name = 'logistics'

router = DefaultRouter()
router.register(r'shipments', ShipmentViewSet, basename='shipment')
router.register(r'tracking', ShipmentTrackingViewSet, basename='tracking')
router.register(r'routes', DeliveryRouteViewSet, basename='route')
router.register(r'invoices', InvoiceViewSet, basename='invoice')

urlpatterns = [
    path('', include(router.urls)),
]
