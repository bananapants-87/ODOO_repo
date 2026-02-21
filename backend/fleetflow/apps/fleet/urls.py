from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FleetViewSet

app_name = 'fleet'

router = DefaultRouter()
router.register(r'', FleetViewSet, basename='fleet')

urlpatterns = [
    path('', include(router.urls)),
]
