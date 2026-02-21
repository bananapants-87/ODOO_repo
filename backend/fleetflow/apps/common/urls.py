from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LocationViewSet, DocumentTypeViewSet, SystemLogViewSet, HealthViewSet

app_name = 'common'

router = DefaultRouter()
router.register(r'locations', LocationViewSet, basename='location')
router.register(r'document-types', DocumentTypeViewSet, basename='document-type')
router.register(r'logs', SystemLogViewSet, basename='log')
router.register(r'health', HealthViewSet, basename='health')

urlpatterns = [
    path('', include(router.urls)),
]
