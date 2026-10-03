from django.utils import timezone
from django.db import transaction
from rest_framework import serializers
from django.db.models import Avg
from .models import (
    ServiceCategory,
    Service,
    Staff,
    StaffService,
    StaffAvailability,
    StaffLeave,
    Package,
    PackageBenefit,
    PackageUsage,
    CustomerPackage,
    AppointmentService,
    Appointment,
    Payment,
    Review,
)


def _absolute_media_url(request, image):
    if not image:
        return None
    url = image.url
    return request.build_absolute_uri(url) if request else url


class ServiceCategorySerializer(serializers.ModelSerializer):
    image_before_url = serializers.SerializerMethodField()
    image_after_url = serializers.SerializerMethodField()

    class Meta:
        model = ServiceCategory
        fields = [
            "id", "name", "description",
            "image_before_url", "image_after_url",
        ]

    def get_image_before_url(self, obj):
        return _absolute_media_url(self.context.get("request"), obj.image_before)

    def get_image_after_url(self, obj):
        return _absolute_media_url(self.context.get("request"), obj.image_after)


class ServiceSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_image_before_url = serializers.SerializerMethodField()
    category_image_after_url = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    avg_rating    = serializers.SerializerMethodField()
    review_count  = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = [
            "id", "name", "description", "price", "duration_minutes",
            "category", "category_name",
            "image", "image_url",
            "category_image_before_url", "category_image_after_url",
            "is_active",
            "avg_rating", "review_count",
        ]
        extra_kwargs = {
            "image": {"required": False, "allow_null": True, "write_only": True},
        }

    def _approved_qs(self, obj):
        return Review.objects.filter(
            status=Review.Status.APPROVED,
            appointment__services__service=obj,
        )

    def get_avg_rating(self, obj):
        avg = self._approved_qs(obj).aggregate(v=Avg("rating"))["v"]
        return round(avg, 1) if avg else None

    def get_review_count(self, obj):
        return self._approved_qs(obj).distinct().count()

    def get_image_url(self, obj):
        return _absolute_media_url(self.context.get("request"), obj.image)

    def get_category_image_before_url(self, obj):
        category = getattr(obj, "category", None)
        return _absolute_media_url(
            self.context.get("request"),
            getattr(category, "image_before", None),
        )

    def get_category_image_after_url(self, obj):
        category = getattr(obj, "category", None)
        return _absolute_media_url(
            self.context.get("request"),
            getattr(category, "image_after", None),
        )


class StaffSerializer(serializers.ModelSerializer):
    user_name    = serializers.CharField(source="user.full_name", read_only=True)
    user_email   = serializers.CharField(source="user.email", read_only=True)
    photo_url    = serializers.SerializerMethodField()
    avg_rating   = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Staff
        fields = [
            "id", "user", "user_name", "user_email", "bio", "photo", "photo_url",
            "is_active", "joined_at", "avg_rating", "review_count",
        ]

    def get_photo_url(self, obj):
        return _absolute_media_url(self.context.get("request"), obj.photo)

    def _approved_qs(self, obj):
        return Review.objects.filter(status=Review.Status.APPROVED, staff=obj)

    def get_avg_rating(self, obj):
        avg = self._approved_qs(obj).aggregate(v=Avg("rating"))["v"]
        return round(avg, 1) if avg else None

    def get_review_count(self, obj):
        return self._approved_qs(obj).count()


class StaffServiceSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source="staff.user.full_name", read_only=True)
    service_name = serializers.CharField(source="service.name", read_only=True)

    class Meta:
        model = StaffService
        fields = ["id", "staff", "service", "staff_name", "service_name"]


class PackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Package
        fields = ["id", "name", "package_type", "description", "price", "validity_days", "is_active"]


class PackageBenefitSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source="service.name", read_only=True)

    class Meta:
        model = PackageBenefit
        fields = ["id", "service", "service_name", "quantity"]


class PackageDetailSerializer(serializers.ModelSerializer):
    benefits = PackageBenefitSerializer(many=True)

    class Meta:
        model = Package
        fields = ["id", "name", "package_type", "description", "price", "validity_days", "benefits", "is_active"]

    def create(self, validated_data):
        benefits_data = validated_data.pop("benefits", [])
        package = Package.objects.create(**validated_data)
        for b in benefits_data:
            PackageBenefit.objects.create(package=package, **b)
        return package

    def update(self, instance, validated_data):
        benefits_data = validated_data.pop("benefits", None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        # Replace benefits entirely when provided
        if benefits_data is not None:
            instance.benefits.all().delete()
            for b in benefits_data:
                PackageBenefit.objects.create(package=instance, **b)
        return instance


class PackageUsageSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source="service.name", read_only=True)

    class Meta:
        model = PackageUsage
        fields = ["id", "service", "service_name", "used_at"]


class CustomerPackageSerializer(serializers.ModelSerializer):
    package_name = serializers.CharField(source="package.name", read_only=True)
    package_price = serializers.DecimalField(source="package.price", max_digits=10, decimal_places=2, read_only=True)
    package_type = serializers.CharField(source="package.package_type", read_only=True)
    benefits = serializers.SerializerMethodField()
    usages = PackageUsageSerializer(many=True, read_only=True)
    sessions_included = serializers.SerializerMethodField()
    sessions_used = serializers.SerializerMethodField()
    sessions_remaining = serializers.SerializerMethodField()

    class Meta:
        model = CustomerPackage
        fields = [
            "id",
            "package",
            "package_name",
            "package_price",
            "package_type",
            "purchase_date",
            "expiry_date",
            "status",
            "benefits",
            "usages",
            "sessions_included",
            "sessions_used",
            "sessions_remaining",
        ]

    def _benefit_rows(self, obj):
        cache = getattr(obj, "_benefit_rows_cache", None)
        if cache is not None:
            return cache

        used_counts = {}
        for usage in obj.usages.all():
            used_counts[usage.service_id] = used_counts.get(usage.service_id, 0) + 1

        rows = []
        for benefit in obj.package.benefits.all():
            used = used_counts.get(benefit.service_id, 0)
            included = benefit.quantity
            rows.append({
                "service": benefit.service_id,
                "service_name": benefit.service.name,
                "included": included,
                "used": used,
                "remaining": max(0, included - used),
            })
        obj._benefit_rows_cache = rows
        return rows

    def get_benefits(self, obj):
        return self._benefit_rows(obj)

    def get_sessions_included(self, obj):
        return sum(row["included"] for row in self._benefit_rows(obj))

    def get_sessions_used(self, obj):
        return sum(row["used"] for row in self._benefit_rows(obj))

    def get_sessions_remaining(self, obj):
        return sum(row["remaining"] for row in self._benefit_rows(obj))


class AppointmentServiceSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source="service.name", read_only=True)

    class Meta:
        model = AppointmentService
        fields = ["id", "service", "service_name", "price_at_booking", "is_package_used"]


class AppointmentSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)
    staff_name = serializers.CharField(source="staff.user.full_name", read_only=True)
    services = AppointmentServiceSerializer(many=True, read_only=True)
    review = serializers.SerializerMethodField()
    last_whatsapp = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            "id", "customer", "customer_name", "staff", "staff_name",
            "appointment_date", "start_time", "end_time",
            "status", "notes", "services", "created_at", "review",
            "last_whatsapp",
        ]
        read_only_fields = [
            "customer",
            "created_at",
            "status",
            "staff",
            "appointment_date",
            "start_time",
            "end_time",
        ]

    def get_review(self, obj):
        try:
            review = obj.review
        except Review.DoesNotExist:
            return None
        return {
            "id": review.id,
            "rating": review.rating,
            "comment": review.comment,
            "status": review.status,
        }

    def get_last_whatsapp(self, obj):
        msg = obj.whatsapp_messages.order_by("-created_at").first()
        if not msg:
            return None
        return {
            "kind": msg.kind,
            "status": msg.status,
            "error": msg.error,
            "created_at": msg.created_at,
        }


def _validate_appointment_business_rules(staff, services, appointment_date, start_time, end_time, exclude_pk=None):
    if not staff.is_active:
        raise serializers.ValidationError({
            "staff": "Selected staff member is not currently active."
        })

    if start_time and end_time and end_time <= start_time:
        raise serializers.ValidationError({
            "end_time": "End time must be after start time."
        })

    if appointment_date and appointment_date < timezone.now().date():
        raise serializers.ValidationError({
            "appointment_date": "Appointment date cannot be in the past."
        })

    if services:
        allowed_service_ids = set(
            StaffService.objects.filter(staff=staff).values_list("service_id", flat=True)
        )
        selected_ids = {s.id for s in services}
        invalid = selected_ids - allowed_service_ids

        if invalid:
            raise serializers.ValidationError({
                "services": f"Selected staff is not specialized in service id(s): {sorted(invalid)}"
            })

    if appointment_date and start_time and end_time:
        day_of_week = appointment_date.weekday()

        available = StaffAvailability.objects.filter(
            staff=staff,
            day_of_week=day_of_week,
            is_available=True,
            start_time__lte=start_time,
            end_time__gte=end_time,
        ).exists()

        if not available:
            raise serializers.ValidationError({
                "start_time": "Staff is not available at the selected day/time."
            })

        on_leave = StaffLeave.objects.filter(
            staff=staff,
            is_approved=True,
            start_date__lte=appointment_date,
            end_date__gte=appointment_date,
        ).exists()

        if on_leave:
            raise serializers.ValidationError({
                "appointment_date": "Staff is on approved leave on the selected date."
            })

        conflicting = Appointment.objects.filter(
            staff=staff,
            appointment_date=appointment_date,
            status__in=[
                Appointment.Status.PENDING,
                Appointment.Status.CONFIRMED,
                Appointment.Status.RESCHEDULED,
            ],
            start_time__lt=end_time,
            end_time__gt=start_time,
        )

        if exclude_pk:
            conflicting = conflicting.exclude(pk=exclude_pk)

        if conflicting.exists():
            raise serializers.ValidationError({
                "start_time": "Staff already has an appointment overlapping this time slot."
            })


def _active_packages_covering(user, service):
    now = timezone.now()
    return CustomerPackage.objects.filter(
        customer=user,
        status=CustomerPackage.Status.ACTIVE,
        is_active=True,
        expiry_date__gte=now,
        package__benefits__service=service,
    ).select_related("package").prefetch_related(
        "usages",
        "package__benefits",
    ).distinct().order_by("expiry_date")


def _pick_package_for_service(user, service):
    for pkg in _active_packages_covering(user, service):
        if pkg.remaining_for_service(service.id) > 0:
            return pkg
    return None


class CustomerAppointmentCreateSerializer(serializers.ModelSerializer):
    services = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.filter(is_active=True),
        many=True,
        write_only=True,
    )
    use_package = serializers.BooleanField(required=False, default=False, write_only=True)
    package_used = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Appointment
        fields = [
            "id",
            "staff",
            "appointment_date",
            "start_time",
            "end_time",
            "notes",
            "services",
            "use_package",
            "package_used",
            "status",
        ]
        read_only_fields = ["id", "status", "package_used"]

    def get_package_used(self, obj):
        return obj.services.filter(is_package_used=True).exists()

    def validate(self, attrs):
        staff = attrs.get("staff")
        appointment_date = attrs.get("appointment_date")
        start_time = attrs.get("start_time")
        end_time = attrs.get("end_time")
        services = attrs.get("services")
        use_package = attrs.get("use_package", False)
        customer = attrs.get("customer") or self.context["request"].user

        if not services:
            raise serializers.ValidationError({
                "services": "At least one service must be selected."
            })

        _validate_appointment_business_rules(
            staff, services, appointment_date, start_time, end_time
        )

        if use_package:
            for service in services:
                covering = list(_active_packages_covering(customer, service))
                if not covering:
                    raise serializers.ValidationError({
                        "use_package": "This service is not included in your active packages."
                    })
                if not _pick_package_for_service(customer, service):
                    raise serializers.ValidationError({
                        "code": "PACKAGE_EXHAUSTED",
                        "use_package": (
                            f"Oops — all remaining sessions for {service.name} "
                            "on your package are used up. Please pay to book."
                        ),
                    })

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        services = validated_data.pop("services")
        use_package = validated_data.pop("use_package", False)
        customer = validated_data.get("customer")
        validated_data["status"] = (
            Appointment.Status.CONFIRMED if use_package else Appointment.Status.PENDING
        )
        appointment = Appointment.objects.create(**validated_data)

        for service in services:
            applied = False
            if use_package:
                pkg = _pick_package_for_service(customer, service)
                if pkg:
                    pkg = CustomerPackage.objects.select_for_update().get(pk=pkg.pk)
                    applied = pkg.consume_service(service)
                if not applied:
                    raise serializers.ValidationError({
                        "code": "PACKAGE_EXHAUSTED",
                        "use_package": (
                            f"Oops — all remaining sessions for {service.name} "
                            "on your package are used up. Please pay to book."
                        ),
                    })

            AppointmentService.objects.create(
                appointment=appointment,
                service=service,
                price_at_booking=0 if applied else service.price,
                is_package_used=applied,
            )

        return appointment


class AdminAppointmentWriteSerializer(serializers.ModelSerializer):
    services = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(), many=True, write_only=True
    )

    class Meta:
        model = Appointment
        fields = [
            "id", "customer", "staff", "appointment_date",
            "start_time", "end_time", "status", "notes", "services",
        ]

    def validate(self, data):
        staff = data.get("staff") or getattr(self.instance, "staff", None)
        services = data.get("services")
        appointment_date = data.get(
            "appointment_date",
            getattr(self.instance, "appointment_date", None),
        )
        start = data.get("start_time") or getattr(self.instance, "start_time", None)
        end = data.get("end_time") or getattr(self.instance, "end_time", None)

        if staff:
            _validate_appointment_business_rules(
                staff,
                services,
                appointment_date,
                start,
                end,
                exclude_pk=self.instance.pk if self.instance else None,
            )

        return data

    def create(self, validated_data):
        services = validated_data.pop("services")
        appointment = Appointment.objects.create(**validated_data)
        for service in services:
            AppointmentService.objects.create(
                appointment=appointment, service=service, price_at_booking=service.price,
            )
        return appointment

    def update(self, instance, validated_data):
        services = validated_data.pop("services", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if services is not None:
            instance.services.all().delete()
            for service in services:
                AppointmentService.objects.create(
                    appointment=instance, service=service, price_at_booking=service.price,
                )
        return instance


class PaymentSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)
    customer_email = serializers.CharField(source="customer.email", read_only=True)
    customer_phone = serializers.CharField(source="customer.phone", read_only=True)
    package_name = serializers.CharField(source="customer_package.package.name", read_only=True, default=None)
    category = serializers.CharField(read_only=True)
    payment_type = serializers.CharField(read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id", "customer", "customer_name", "customer_email", "customer_phone",
            "amount", "payment_for", "package_name", "category", "payment_type", "status",
            "gateway_order_id", "gateway_payment_id", "created_at", "updated_at"
        ]


def _customer_display_name(user):
    name = (getattr(user, "full_name", None) or "").strip()
    if not name:
        return "Guest"
    parts = name.split()
    if len(parts) == 1:
        return parts[0]
    return f"{parts[0]} {parts[-1][0]}."


class PublicReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    customer_photo_url = serializers.SerializerMethodField()
    staff_name = serializers.CharField(source="staff.user.full_name", read_only=True)
    service_names = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            "id", "rating", "comment", "customer_name", "customer_photo_url",
            "staff_name", "service_names", "created_at",
        ]

    def get_customer_name(self, obj):
        return _customer_display_name(obj.customer)

    def get_customer_photo_url(self, obj):
        return _absolute_media_url(
            self.context.get("request"),
            getattr(obj.customer, "photo", None),
        )

    def get_service_names(self, obj):
        return list(obj.appointment.services.values_list("service__name", flat=True))


class ReviewWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ["id", "appointment", "rating", "comment", "status", "created_at"]
        read_only_fields = ["id", "status", "created_at"]

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate_appointment(self, appointment):
        request = self.context["request"]
        if appointment.customer_id != request.user.id:
            raise serializers.ValidationError("You can only review your own appointments.")
        if appointment.status != Appointment.Status.COMPLETED:
            raise serializers.ValidationError("You can only review a completed appointment.")
        if Review.objects.filter(appointment=appointment).exists():
            raise serializers.ValidationError("This appointment already has a review.")
        return appointment

    def create(self, validated_data):
        appointment = validated_data["appointment"]
        return Review.objects.create(
            appointment=appointment,
            customer=self.context["request"].user,
            staff=appointment.staff,
            rating=validated_data["rating"],
            comment=validated_data.get("comment", ""),
            status=Review.Status.PENDING,
        )


class ReviewUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ["id", "rating", "comment", "status", "created_at"]
        read_only_fields = ["id", "status", "created_at"]

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def update(self, instance, validated_data):
        instance.rating = validated_data.get("rating", instance.rating)
        instance.comment = validated_data.get("comment", instance.comment)
        instance.status = Review.Status.PENDING
        instance.save(update_fields=["rating", "comment", "status", "updated_at"])
        return instance


class AdminReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)
    customer_email = serializers.CharField(source="customer.email", read_only=True)
    staff_name = serializers.CharField(source="staff.user.full_name", read_only=True)
    service_names = serializers.SerializerMethodField()
    appointment_date = serializers.DateField(source="appointment.appointment_date", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id", "appointment", "appointment_date",
            "customer", "customer_name", "customer_email",
            "staff", "staff_name", "service_names",
            "rating", "comment", "status", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "appointment", "customer", "staff",
            "rating", "comment", "created_at", "updated_at",
        ]

    def get_service_names(self, obj):
        return list(obj.appointment.services.values_list("service__name", flat=True))