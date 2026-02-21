"""
URL configuration for FleetFlow project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# 🔥 Import your API view
from fleetflow.apps.common.views import register_user


urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/vehicles/', include('fleetflow.apps.vehicles.urls')),
    path('api/drivers/', include('fleetflow.apps.drivers.urls')),
    path('api/fleet/', include('fleetflow.apps.fleet.urls')),
    path('api/logistics/', include('fleetflow.apps.logistics.urls')),
    path('api/', include('fleetflow.apps.common.urls')),

    # ✅ register endpoint
    path("api/register/", register_user),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)