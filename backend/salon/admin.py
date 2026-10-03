from django.contrib import admin
from .models import ServiceCategory
from .models import (Service,
                     Staff,
                     StaffService,
                     StaffAvailability,
                     StaffLeave,Package,
                     PackageBenefit,
                     PackageUsage,
                     CustomerPackage,
                     Appointment,
                     AppointmentService,
                     Payment,
                     Invoice,
                     Refund,
                     Review,
                     WhatsAppMessage)

# Register your models here.

@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "is_active", "created_at", "updated_at")
    list_filter = ("is_active", "created_at")
    search_fields = ("name", "description")
    list_display_links = ("name",)
    fields = ("name", "description", "is_active")


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "price", "duration_minutes", "is_active")
    list_filter = ("category", "is_active", "created_at")
    search_fields = ("name", "description")
    list_display_links = ("name",)
    fields = ("category", "name", "description", "price", "duration_minutes", "image", "is_active")


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = ("user", "bio", "is_active", "joined_at")
    list_filter = ("is_active", "joined_at")
    search_fields = ("user__email", "user__full_name", "bio")
    list_display_links = ("user",)
    fields = ("user", "bio", "photo", "is_active")

@admin.register(StaffService)
class StaffServiceAdmin(admin.ModelAdmin):
    list_display = ("staff", "service", "created_at")
    list_filter = ("service", "created_at")
    search_fields = ("staff__user__full_name", "service__name")
    list_display_links = ("staff",)
    fields = ("staff", "service")


@admin.register(StaffAvailability)
class StaffAvailabilityAdmin(admin.ModelAdmin):
    list_display = ("staff", "day_of_week", "start_time", "end_time", "is_available")
    list_filter = ("day_of_week", "is_available")
    search_fields = ("staff__user__full_name",)
    list_display_links = ("staff",)
    fields = ("staff", "day_of_week", "start_time", "end_time", "is_available")


@admin.register(StaffLeave)
class StaffLeaveAdmin(admin.ModelAdmin):
    list_display = ("staff", "start_date", "end_date", "leave_type", "is_approved")
    list_filter = ("leave_type", "is_approved", "start_date")
    search_fields = ("staff__user__full_name", "reason")
    list_display_links = ("staff",)
    fields = ("staff", "start_date", "end_date", "leave_type", "reason", "is_approved")


@admin.register(Package)
class PackageAdmin(admin.ModelAdmin):
    list_display = ("name", "package_type", "price", "validity_days", "is_active")
    list_filter = ("package_type", "is_active")
    search_fields = ("name", "description")
    fields = ("name", "package_type", "description", "price", "validity_days", "is_active")


@admin.register(PackageBenefit)
class PackageBenefitAdmin(admin.ModelAdmin):
    list_display = ("package", "service", "quantity")
    list_filter = ("package",)
    search_fields = ("package__name", "service__name")


@admin.register(CustomerPackage)
class CustomerPackageAdmin(admin.ModelAdmin):
    list_display = ("customer", "package", "purchase_date", "expiry_date", "status")
    list_filter = ("status", "package")
    search_fields = ("customer__email", "customer__full_name", "package__name")


@admin.register(PackageUsage)
class PackageUsageAdmin(admin.ModelAdmin):
    list_display = ("customer_package", "service", "used_at")
    list_filter = ("service", "used_at")
    search_fields = ("customer_package__customer__email", "service__name")


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ("customer", "staff", "appointment_date", "start_time", "status")
    list_filter = ("status", "appointment_date")
    search_fields = ("customer__email", "customer__full_name", "staff__user__full_name")
    fields = ("customer", "staff", "appointment_date", "start_time", "end_time", "status", "notes")


@admin.register(AppointmentService)
class AppointmentServiceAdmin(admin.ModelAdmin):
    list_display = ("appointment", "service", "price_at_booking", "is_package_used")
    list_filter = ("is_package_used",)
    search_fields = ("appointment__customer__email", "service__name")


# payments

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("customer", "amount", "payment_for", "status", "created_at")
    list_filter = ("status", "payment_for", "created_at")
    search_fields = ("customer__email", "gateway_order_id", "gateway_payment_id")
    fields = ("customer", "amount", "payment_for", "customer_package", "status")


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("invoice_number", "payment", "created_at")
    search_fields = ("invoice_number", "payment__customer__email")


@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = ("payment", "amount", "status", "created_at")
    list_filter = ("status",)


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("customer", "staff", "rating", "status", "created_at")
    list_filter = ("status", "rating", "created_at")
    search_fields = ("customer__full_name", "customer__email", "comment")
    fields = ("appointment", "customer", "staff", "rating", "comment", "status")


@admin.register(WhatsAppMessage)
class WhatsAppMessageAdmin(admin.ModelAdmin):
    list_display = ("appointment", "kind", "phone", "status", "created_at")
    list_filter = ("kind", "status", "created_at")
    search_fields = ("phone", "body", "error")
    readonly_fields = ("appointment", "kind", "phone", "body", "status", "error", "created_at")