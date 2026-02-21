from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DriverViewSet, DriverViolationViewSet, DriverTrainingViewSet

app_name = 'drivers'

router = DefaultRouter()
router.register(r'', DriverViewSet, basename='driver')
router.register(r'violations', DriverViolationViewSet, basename='violation')
router.register(r'trainings', DriverTrainingViewSet, basename='training')

urlpatterns = [
    path('', include(router.urls)),
]
