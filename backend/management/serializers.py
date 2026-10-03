from django.utils.crypto import get_random_string
from rest_framework import serializers
from accounts.models import CustomUser
from salon.models import ( Staff, 
    ServiceCategory, StaffService, StaffAvailability, StaffLeave,
)
from academy.models import AcademyApplication
from salon.serializers import (
    AppointmentSerializer, CustomerPackageSerializer, PaymentSerializer,
)
from academy.serializers import AcademyApplicationSerializer, BatchStudentSerializer
from .models import ContactInquiry


class ContactInquirySerializer(serializers.ModelSerializer):
    class Meta:
        model  = ContactInquiry
        fields = ["id", "name", "email", "phone", "subject", "message", "status", "created_at"]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        # Public submissions must always start as NEW; only admins update status later.
        validated_data.pop("status", None)
        return super().create(validated_data)

from .models import Salary;

 
class DashboardStatsSerializer(serializers.Serializer):
    total_customers = serializers.IntegerField()
    total_staff = serializers.IntegerField()
    total_services = serializers.IntegerField()
    total_appointments = serializers.IntegerField()
    total_packages_sold = serializers.IntegerField()    
    today_appointments = serializers.IntegerField()
    pending_appointments = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)


class CustomerListSerializer(serializers.ModelSerializer):
    is_academy_student = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ["id", "email", "full_name", "phone", "is_active", "date_joined", "is_academy_student"]

    def get_is_academy_student(self, obj):
        return bool(getattr(obj, "has_application", False) or getattr(obj, "has_enrollment", False))


class RevenueReportSerializer(serializers.Serializer):
    period = serializers.CharField()
    start_date = serializers.DateField(allow_null=True)
    end_date = serializers.DateField(allow_null=True)
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_payments = serializers.IntegerField()
    package_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    appointment_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    academy_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    refunded_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    net_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    daily_breakdown = serializers.ListField(child=serializers.DictField(), allow_empty=True)


class AcademyStatsSerializer(serializers.Serializer):
    total_courses = serializers.IntegerField()
    total_batches = serializers.IntegerField()
    total_students = serializers.IntegerField()
    total_applications = serializers.IntegerField()
    pending_applications = serializers.IntegerField()


class CustomerWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "full_name", "email", "phone"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        # create_user hashes the password; a plain create() leaves a row whose
        # password field is empty, so the customer can never log in or reset it.
        return CustomUser.objects.create_user(
            password=get_random_string(32),
            role="CUSTOMER",
            **validated_data,
        )

class ApplicationStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademyApplication
        fields = ["id", "status", "reviewed_at"]
        read_only_fields = ["id", "reviewed_at"]


class CustomerDetailSerializer(serializers.ModelSerializer):
    appointments = AppointmentSerializer(many=True, read_only=True)
    packages = CustomerPackageSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    academy_applications = AcademyApplicationSerializer(source="applications", many=True, read_only=True)
    academy_enrollments = BatchStudentSerializer(source="batch_enrollments", many=True, read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            "id", "email", "full_name", "phone",
            "role", "is_active", "is_email_verified", "date_joined",
            "appointments", "packages", "payments",
            "academy_applications", "academy_enrollments",
        ]
        read_only_fields = fields

class ServiceCategoryAdminSerializer(serializers.ModelSerializer):
    image_before_url = serializers.SerializerMethodField()
    image_after_url  = serializers.SerializerMethodField()

    class Meta:
        model  = ServiceCategory
        fields = ["id", "name", "description", "image_before", "image_after",
                  "image_before_url", "image_after_url", "is_active"]
        extra_kwargs = {
            "image_before": {"required": False, "allow_null": True},
            "image_after":  {"required": False, "allow_null": True},
        }

    def _abs(self, request, path):
        if not path:
            return None
        return request.build_absolute_uri(f"/media/{path}")

    def get_image_before_url(self, obj):
        request = self.context.get("request")
        return self._abs(request, str(obj.image_before)) if obj.image_before else None

    def get_image_after_url(self, obj):
        request = self.context.get("request")
        return self._abs(request, str(obj.image_after)) if obj.image_after else None


class AdminStaffSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.full_name", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)
    user_role = serializers.CharField(source="user.role", read_only=True)

    class Meta:
        model = Staff
        fields = [
            "id", "user", "user_name", "user_email", "user_role",
            "bio", "photo", "is_active", "joined_at",
        ]
        read_only_fields = ["id", "joined_at"]

    def validate_user(self, user):
        if user.role not in ("STAFF", "TRAINER"):
            raise serializers.ValidationError(
                "Selected user must have role STAFF or TRAINER."
            )
        return user


class AdminStaffAvailabilitySerializer(serializers.ModelSerializer):
    day_display = serializers.CharField(source="get_day_of_week_display", read_only=True)

    class Meta:
        model = StaffAvailability
        fields = ["id", "staff", "day_of_week", "day_display", "start_time", "end_time", "is_available"]
        read_only_fields = ["id", "staff"]


class AdminStaffLeaveSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffLeave
        fields = ["id", "staff", "start_date", "end_date", "leave_type", "reason", "is_approved"]
        read_only_fields = ["id", "staff", "is_approved"]


class AdminStaffServiceSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source="staff.user.full_name", read_only=True)
    service_name = serializers.CharField(source="service.name", read_only=True)

    class Meta:
        model = StaffService
        fields = ["id", "staff", "service", "staff_name", "service_name"]
        read_only_fields = ["staff"]

class EligibleStaffUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "email", "full_name", "role"]


class UserAccountListSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "email", "full_name", "phone", "role", "is_active", "date_joined"]


class UserAccountCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = CustomUser
        fields = ["id", "email", "full_name", "phone", "role", "password"]
        read_only_fields = ["id"]

    def validate_role(self, role):
        if role not in ("STAFF", "TRAINER", "MANAGER"):
            raise serializers.ValidationError(
                "Role must be one of STAFF, TRAINER, or MANAGER."
            )
        return role

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = CustomUser.objects.create_user(password=password, **validated_data)
        return user


class UserAccountRoleUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "role", "is_active"]
        read_only_fields = ["id"]

    def validate_role(self, role):
        if role not in ("STAFF", "TRAINER", "MANAGER"):
            raise serializers.ValidationError(
                "Role must be one of STAFF, TRAINER, or MANAGER."
            )
        return role




class SalarySerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)
    employee_email = serializers.CharField(source="employee.email", read_only=True)
    employee_role = serializers.CharField(source="employee.role", read_only=True)

    class Meta:
        model = Salary
        fields = [
            "id", "employee", "employee_name", "employee_email", "employee_role",
            "amount", "month", "status", "paid_date",
        ]
        read_only_fields = ["paid_date"]
