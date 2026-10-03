from django.db import models
from django.conf import settings
from django.utils import timezone

# Create your models here.

class ServiceCategory(models.Model):
    name        = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    image_before = models.ImageField(upload_to="categories/", blank=True, null=True)
    image_after  = models.ImageField(upload_to="categories/", blank=True, null=True)
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "service_categories"
        verbose_name = "Service Category"
        verbose_name_plural = "Service Categories"
        ordering = ["-created_at"]


    def __str__(self):
        return self.name


class Service(models.Model):
    category = models.ForeignKey(ServiceCategory,on_delete=models.PROTECT, related_name="services",)
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration_minutes = models.PositiveIntegerField(help_text="Service duration in minutes")
    image = models.ImageField(upload_to="service_photos/", blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "services"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.category.name})"


class Staff(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="staff_profile",
    )
    bio = models.TextField(blank=True)
    photo = models.ImageField(upload_to="staff_photos/", blank=True)
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "staff"
        verbose_name_plural = "Staff"
        ordering = ["-joined_at"]

    def __str__(self):
        return f"{self.user.full_name} ({self.user.email})"


class StaffService(models.Model):
    staff = models.ForeignKey(
        Staff,on_delete=models.CASCADE,related_name="services",
    )
    service = models.ForeignKey(
        Service,on_delete=models.CASCADE,related_name="staff_members",  
    )
    created_at = models.DateTimeField(auto_now_add=True)  

    class Meta:
        db_table = "staff_services"
        unique_together = ["staff", "service"]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.staff.user.full_name} ({self.service.name})"  


class StaffAvailability(models.Model):
    class DayOfWeek(models.IntegerChoices):
        MONDAY = 0, "Monday"
        TUESDAY = 1, "Tuesday"
        WEDNESDAY = 2, "Wednesday"
        THURSDAY = 3, "Thursday"
        FRIDAY = 4, "Friday"
        SATURDAY = 5, "Saturday"
        SUNDAY = 6, "Sunday"

    staff = models.ForeignKey(
        Staff,on_delete=models.CASCADE,related_name="availability",
    )
    day_of_week = models.IntegerField(choices=DayOfWeek.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)

    class Meta:
        db_table = "staff_availability"
        unique_together = ["staff", "day_of_week"]
        ordering = ["day_of_week", "start_time"]

    def __str__(self):
        return f"{self.staff.user.full_name} - {self.get_day_of_week_display()} ({self.start_time} to {self.end_time})"


class StaffLeave(models.Model):
    class LeaveType(models.TextChoices):
        SICK = "SICK", "Sick Leave"
        PERSONAL = "PERSONAL", "Personal Leave"
        VACATION = "VACATION", "Vacation"
        OTHER = "OTHER", "Other"

    staff = models.ForeignKey(
        Staff,on_delete=models.CASCADE,related_name="leaves",
    )
    start_date = models.DateField()
    end_date = models.DateField()
    leave_type = models.CharField(max_length=20, choices=LeaveType.choices)
    reason = models.TextField(blank=True)
    is_approved = models.BooleanField(default=False)

    class Meta:
        db_table = "staff_leaves"
        ordering = ["-start_date"]

    def __str__(self):
        return  f"{self.staff.user.full_name} - {self.start_date} to {self.end_date}"



# packages 

class Package(models.Model):
    class  PackageType(models.TextChoices):
        CLASSIC = "CLASSIC", "Classic"
        PREMIUM = "PREMIUM", "Premium"
        EXCLUSIVE = "EXCLUSIVE", "Exclusive"

    name = models.CharField(max_length=100)
    package_type = models.CharField(max_length=20, choices=PackageType.choices)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    validity_days = models.PositiveIntegerField(help_text="Package valid for how many days")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "packages"
        ordering = ["-created_at"]

    def __str__(self):
         return f"{self.name} ({self.package_type}) - ₹{self.price}"


class PackageBenefit(models.Model):
    package = models.ForeignKey(Package, on_delete=models.CASCADE, related_name="benefits")
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(help_text="How many times this service is included")

    class Meta:
        db_table = "package_benefits"
        unique_together = ["package", "service"]

    def __str__(self):
        return f"{self.package.name}: {self.service.name} x{self.quantity}"


class CustomerPackage(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        EXPIRED = "EXPIRED", "Expired"
        USED = "USED", "Fully Used"

    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="packages")
    package = models.ForeignKey(Package, on_delete=models.CASCADE)
    purchase_date = models.DateTimeField(auto_now_add=True)
    expiry_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "customer_packages"
        ordering = ["-purchase_date"]

    def remaining_for_service(self, service_id):
        benefit = self.package.benefits.filter(service_id=service_id).first()
        if not benefit:
            return 0
        used = self.usages.filter(service_id=service_id).count()
        return max(0, benefit.quantity - used)

    def total_remaining(self):
        used_counts = {}
        for usage in self.usages.all():
            used_counts[usage.service_id] = used_counts.get(usage.service_id, 0) + 1
        remaining = 0
        for benefit in self.package.benefits.all():
            remaining += max(0, benefit.quantity - used_counts.get(benefit.service_id, 0))
        return remaining

    def consume_service(self, service):
        if self.remaining_for_service(service.id) <= 0:
            return False
        PackageUsage.objects.create(customer_package=self, service=service)
        cache = getattr(self, "_prefetched_objects_cache", None)
        if cache is not None:
            cache.pop("usages", None)
        if self.total_remaining() <= 0:
            self.status = self.Status.USED
            self.save(update_fields=["status"])
        return True

    def restore_service(self, service):
        usage = self.usages.filter(service=service).order_by("-used_at").first()
        if not usage:
            return False
        usage.delete()
        cache = getattr(self, "_prefetched_objects_cache", None)
        if cache is not None:
            cache.pop("usages", None)
        if self.status == self.Status.USED and self.total_remaining() > 0:
            self.status = self.Status.ACTIVE
            self.save(update_fields=["status"])
        return True

    def __str__(self):
        return f"{self.customer.full_name} - {self.package.name}"



class PackageUsage(models.Model):
    customer_package = models.ForeignKey(CustomerPackage, on_delete=models.CASCADE, related_name="usages")
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    used_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "package_usage"
        ordering = ["-used_at"]

    def __str__(self):
        return f"{self.customer_package} used {self.service.name} at {self.used_at}"


# appointment

class Appointment(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        CONFIRMED = "CONFIRMED", "Confirmed"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"
        RESCHEDULED = "RESCHEDULED", "Rescheduled"

    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,related_name="appointments",)
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name="appointments",)
    appointment_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING,)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "appointments"
        ordering = ["-appointment_date", "-start_time"]

    def __str__(self):
        return f"{self.customer.full_name} with {self.staff.user.full_name} on {self.appointment_date} at {self.start_time}"


class AppointmentService(models.Model):
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name="services")
    service = models.ForeignKey(Service, on_delete=models.CASCADE,)
    price_at_booking = models.DecimalField(max_digits=10, decimal_places=2, 
    help_text="Price when booked (may differ from current price)",)
    is_package_used = models.BooleanField(default=False)

    class Meta:
        db_table = "appointment_services"
        unique_together = ["appointment", "service"]

    def __str__(self):
        return f"{self.appointment} - {self.service.name}"


# payment

class Payment(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SUCCESS = "SUCCESS", "Success"
        FAILED = "FAILED", "Failed"
        REFUNDED = "REFUNDED", "Refunded"

    class PaymentFor(models.TextChoices):
        PACKAGE = "PACKAGE", "Package Purchase"
        APPOINTMENT = "APPOINTMENT", "Appointment Booking"
        ACADEMY = "ACADEMY", "Academy Fee"

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="payments",
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_for = models.CharField(max_length=20, choices=PaymentFor.choices)
    package = models.ForeignKey(
        "Package",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pending_payments",
    )
    customer_package = models.ForeignKey(
        CustomerPackage,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments",
    )

    appointment = models.ForeignKey(
        "Appointment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments",
    )
    academy_fee = models.ForeignKey(
        "academy.AcademyFee",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments",
    )
    
    gateway_order_id = models.CharField(max_length=100, blank=True)
    gateway_payment_id = models.CharField(max_length=100, blank=True)
    gateway_signature = models.CharField(max_length=200, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "payments"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.customer.full_name} - ₹{self.amount} - {self.status}"

    @property
    def category(self):
        if self.payment_for in (self.PaymentFor.APPOINTMENT, self.PaymentFor.PACKAGE):
            return "SALON"
        return "ACADEMY"

    @property
    def payment_type(self):
        if self.payment_for == self.PaymentFor.APPOINTMENT:
            return "NON_PACKAGE"
        if self.payment_for == self.PaymentFor.PACKAGE:
            return "PACKAGE"
        return "COURSE_FEE"


class Invoice(models.Model):
    payment = models.OneToOneField(
        Payment, on_delete=models.CASCADE, related_name="invoice",
    )
    invoice_number = models.CharField(max_length=50, unique=True)
    pdf_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "invoices"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Invoice #{self.invoice_number}"


class Refund(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PROCESSED = "PROCESSED", "Processed"
        REJECTED = "REJECTED", "Rejected"

    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name="refunds",
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "refunds"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Refund #{self.id} - ₹{self.amount}"


class Review(models.Model):
    class Status(models.TextChoices):
        PENDING  = "PENDING",  "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    appointment = models.OneToOneField(
        Appointment, on_delete=models.CASCADE, related_name="review",
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews",
    )
    staff = models.ForeignKey(
        Staff, on_delete=models.CASCADE, related_name="reviews",
    )
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True, default="")
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "reviews"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.customer} — {self.rating}★ ({self.status})"


class WhatsAppMessage(models.Model):
    class Kind(models.TextChoices):
        CONFIRMATION = "CONFIRMATION", "Confirmation"
        REMINDER_24H = "REMINDER_24H", "24h Reminder"
        CANCELLED = "CANCELLED", "Cancelled"
        RESCHEDULED = "RESCHEDULED", "Rescheduled"

    class Status(models.TextChoices):
        SENT = "SENT", "Sent"
        FAILED = "FAILED", "Failed"
        SKIPPED = "SKIPPED", "Skipped"

    appointment = models.ForeignKey(
        Appointment, on_delete=models.CASCADE, related_name="whatsapp_messages",
    )
    kind = models.CharField(max_length=20, choices=Kind.choices)
    phone = models.CharField(max_length=20, blank=True, default="")
    body = models.TextField(blank=True, default="")
    status = models.CharField(max_length=20, choices=Status.choices)
    error = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "whatsapp_messages"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.kind} #{self.appointment_id} — {self.status}"






