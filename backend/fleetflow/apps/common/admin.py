from django.contrib import admin
from .models import Location, DocumentType, SystemLog


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'country', 'contact_name', 'created_at']
    list_filter = ['city', 'country', 'created_at']
    search_fields = ['name', 'address', 'city']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(DocumentType)
class DocumentTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_required', 'max_size_mb']
    list_filter = ['is_required']
    search_fields = ['name']


@admin.register(SystemLog)
class SystemLogAdmin(admin.ModelAdmin):
    list_display = ['action', 'level', 'user', 'timestamp']
    list_filter = ['level', 'action', 'timestamp']
    search_fields = ['action', 'description', 'user']
    readonly_fields = ['timestamp']


from django.contrib import admin
from .models import UserProfile

admin.site.register(UserProfile)