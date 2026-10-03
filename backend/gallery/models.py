from django.db import models


class GalleryItem(models.Model):
    CATEGORY_CHOICES = [
        ("salon",   "Salon"),
        ("academy", "Academy"),
    ]

    title       = models.CharField(max_length=150)
    category    = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="salon")
    image       = models.ImageField(upload_to="gallery/", blank=True, null=True)
    description = models.TextField(blank=True)
    order       = models.PositiveIntegerField(
        default=0,
        help_text="Lower numbers appear first in the grid.",
    )
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table         = "gallery_items"
        verbose_name     = "Gallery Item"
        verbose_name_plural = "Gallery Items"
        ordering         = ["order", "-created_at"]

    def __str__(self):
        return f"{self.title} ({self.get_category_display()})"
