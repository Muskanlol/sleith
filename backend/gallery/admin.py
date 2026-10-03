from django.contrib import admin
from .models import GalleryItem


@admin.register(GalleryItem)
class GalleryItemAdmin(admin.ModelAdmin):
    list_display  = ("title", "category", "order", "is_active", "created_at")
    list_filter   = ("category", "is_active")
    list_editable = ("order", "is_active")
    search_fields = ("title", "description")
    ordering      = ("order", "-created_at")
