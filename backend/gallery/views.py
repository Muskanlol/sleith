from rest_framework import generics
from rest_framework.permissions import AllowAny, SAFE_METHODS

from accounts.permissions import IsManagerOrAdmin
from .models import GalleryItem
from .serializers import GalleryItemSerializer


class GalleryItemListView(generics.ListCreateAPIView):
    """
    GET  /api/gallery/  → AllowAny; authenticated admin/manager sees ALL items (incl. inactive),
                          anonymous users see active items only.
    POST /api/gallery/  → admin/manager only (multipart/form-data for image upload)
    """
    serializer_class = GalleryItemSerializer
    # NOTE: Do NOT remove authentication_classes for GET — we need the JWT user
    #       to be resolved so admins can see inactive items. AllowAny ensures
    #       the public can still access without a token.

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [AllowAny()]
        return [IsManagerOrAdmin()]

    def get_queryset(self):
        user = self.request.user
        if user and user.is_authenticated and hasattr(user, 'role') \
                and user.role in ('ADMIN', 'MANAGER'):
            return GalleryItem.objects.all().order_by("order", "-created_at")
        return GalleryItem.objects.filter(is_active=True).order_by("order", "-created_at")

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class GalleryItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/gallery/<id>/  → AllowAny; admins see inactive items too
    PUT    /api/gallery/<id>/  → admin/manager
    PATCH  /api/gallery/<id>/  → admin/manager
    DELETE /api/gallery/<id>/  → admin/manager
    """
    serializer_class = GalleryItemSerializer

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [AllowAny()]
        return [IsManagerOrAdmin()]

    def get_queryset(self):
        user = self.request.user
        if user and user.is_authenticated and hasattr(user, 'role') \
                and user.role in ('ADMIN', 'MANAGER'):
            return GalleryItem.objects.all()
        return GalleryItem.objects.filter(is_active=True)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx
