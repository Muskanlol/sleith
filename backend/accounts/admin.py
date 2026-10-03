from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import CustomUser, UserToken


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ("email", "full_name", "role", "is_active", "is_email_verified", "date_joined")
    list_filter = ("role", "is_active", "is_email_verified")
    search_fields = ("email", "full_name", "phone")
    ordering = ("-date_joined",)

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal Info", {"fields": ("full_name", "phone", "photo")}),
        ("Role & Status", {"fields": ("role", "is_active", "is_staff", "is_superuser", "is_email_verified")}),
        ("Permissions", {"fields": ("groups", "user_permissions")}),
        ("Important Dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "full_name", "role", "password1", "password2"),
        }),
    )


@admin.register(UserToken)
class UserTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "token_type", "created_at", "expires_at", "is_used")
    list_filter = ("token_type", "is_used")