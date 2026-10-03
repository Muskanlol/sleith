from django.urls import path
from .views import GalleryItemListView, GalleryItemDetailView

urlpatterns = [
    path("gallery/",      GalleryItemListView.as_view(),   name="gallery-list"),
    path("gallery/<int:pk>/", GalleryItemDetailView.as_view(), name="gallery-detail"),
]
