from django.apps import AppConfig


class VehiclesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'fleetflow.apps.vehicles'
    verbose_name = 'Vehicles Management'
