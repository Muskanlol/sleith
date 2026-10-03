from rest_framework import serializers
from .models import GalleryItem


class GalleryItemSerializer(serializers.ModelSerializer):
    """
    Public-facing serializer.
    `image_url` returns the absolute URL of the uploaded image so the
    frontend can use it directly without knowing MEDIA_URL.
    """
    image_url = serializers.SerializerMethodField()

    class Meta:
        model  = GalleryItem
        fields = [
            "id",
            "title",
            "category",
            "image",
            "image_url",
            "description",
            "order",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "image_url", "created_at"]

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url
