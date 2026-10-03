from django.db.models import Sum, Count, Q
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings as django_settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, status
from rest_framework.parsers import JSONParser, FormParser, MultiPartParser
from rest_framework.exceptions import PermissionDenied
from datetime import timedelta
from django.db.models.functions import TruncDate
import uuid
from django.db import transaction
from django.shortcuts import get_object_or_404

from accounts.models import CustomUser
from accounts.permissions import (IsManagerOrAdmin, IsAdmin, IsStaffMember, IsTrainer,
                                  CustomerAccessPermission,ServiceAccessPermission, PackageAccessPermission,AppointmentDetailAccessPermission)
from salon.models import Service, Staff, Appointment, Payment, CustomerPackage, AppointmentService,StaffService, StaffAvailability, StaffLeave
from academy.models import Course, Batch, BatchStudent, AcademyApplication, AcademyFee

from .serializers import (
    DashboardStatsSerializer,CustomerListSerializer,RevenueReportSerializer,
    AcademyStatsSerializer,
    ApplicationStatusUpdateSerializer,
    CustomerDetailSerializer,
    CustomerWriteSerializer,
    AdminStaffSerializer,
    AdminStaffAvailabilitySerializer,
    AdminStaffLeaveSerializer,
    EligibleStaffUserSerializer,
    UserAccountCreateSerializer,
    UserAccountListSerializer,
    UserAccountRoleUpdateSerializer,
    PaymentSerializer
)
from salon.serializers import AppointmentSerializer, StaffServiceSerializer,AdminAppointmentWriteSerializer
from django.db.models import Exists, OuterRef
from academy.models import AcademyApplication, BatchStudent
from salon.models import Service, ServiceCategory,Package
from .serializers import ServiceCategoryAdminSerializer, AdminStaffServiceSerializer, SalarySerializer, ContactInquirySerializer
from salon.serializers import ServiceSerializer, PackageSerializer, PackageDetailSerializer
from .models import Salary, ContactInquiry


# ── Contact Inquiry ──────────────────────────────────────────────────────────

class ContactInquiryCreateView(generics.CreateAPIView):
    """Public — anyone can submit a contact form."""
    authentication_classes = []
    permission_classes     = []
    serializer_class       = ContactInquirySerializer

    def perform_create(self, serializer):
        inquiry = serializer.save()
        self._send_admin_notification(inquiry)
        self._send_customer_autoreply(inquiry)

    # ── internal helpers ──────────────────────────────────────────────────

    def _send_admin_notification(self, inquiry):
        """Email the admin/manager that a new contact form was submitted."""
        admin_email = getattr(django_settings, "ADMIN_EMAIL", "")
        if not admin_email:
            return
        subject = f"[SLEITH] New Inquiry: {inquiry.subject or 'No Subject'}"
        body = (
            f"You have a new contact form submission.\n\n"
            f"Name    : {inquiry.name}\n"
            f"Email   : {inquiry.email}\n"
            f"Phone   : {inquiry.phone or '—'}\n"
            f"Subject : {inquiry.subject or '—'}\n\n"
            f"Message:\n{inquiry.message}\n\n"
            f"Reply directly to: {inquiry.email}\n"
        )
        try:
            send_mail(
                subject,
                body,
                django_settings.DEFAULT_FROM_EMAIL,
                [admin_email],
                fail_silently=True,
                reply_to=[inquiry.email] if inquiry.email else None,
            )
        except Exception:
            pass  # never block the response if email fails

    def _send_customer_autoreply(self, inquiry):
        """Send an auto-reply to the customer confirming receipt."""
        if not inquiry.email:
            return
        subject = "We received your message — SLEITH"
        body = (
            f"Hi {inquiry.name},\n\n"
            f"Thank you for reaching out to us! 🌸\n\n"
            f"We've received your message and our team will get back to you "
            f"within 24 hours.\n\n"
            f"Here's a copy of what you sent us:\n"
            f"——————————————————————————\n"
            f"Subject : {inquiry.subject or '—'}\n"
            f"Message : {inquiry.message}\n"
            f"——————————————————————————\n\n"
            f"Warm regards,\n"
            f"Team SLEITH\n"
        )
        try:
            send_mail(
                subject,
                body,
                django_settings.DEFAULT_FROM_EMAIL,
                [inquiry.email],
                fail_silently=True,
            )
        except Exception:
            pass


class AdminContactInquiryListView(generics.ListAPIView):
    """Admin/Manager — list all inquiries with optional status filter."""
    permission_classes   = [IsManagerOrAdmin]
    serializer_class     = ContactInquirySerializer

    def get_queryset(self):
        qs     = ContactInquiry.objects.all()
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class AdminContactInquiryDetailView(generics.RetrieveUpdateAPIView):
    """Admin/Manager — view + update status of a single inquiry."""
    permission_classes = [IsManagerOrAdmin]
    serializer_class   = ContactInquirySerializer
    queryset           = ContactInquiry.objects.all()

    def perform_update(self, serializer):
        serializer.save()


class AdminContactInquiryReplyView(APIView):
    """Admin/Manager — send an email reply to the customer."""
    permission_classes = [IsManagerOrAdmin]

    def post(self, request, pk):
        inquiry = get_object_or_404(ContactInquiry, pk=pk)
        message = request.data.get("message", "").strip()

        if not message:
            return Response({"error": "Reply message is required."}, status=status.HTTP_400_BAD_REQUEST)

        if not inquiry.email:
            return Response({"error": "This inquiry has no email address."}, status=status.HTTP_400_BAD_REQUEST)

        subject = f"Re: {inquiry.subject or 'Your Inquiry'} — SLEITH"
        body = (
            f"Hi {inquiry.name},\n\n"
            f"{message}\n\n"
            f"——————————————————————————\n"
            f"Your original message:\n"
            f"{inquiry.message}\n"
            f"——————————————————————————\n\n"
            f"Warm regards,\n"
            f"Team SLEITH\n"
        )

        try:
            send_mail(
                subject,
                body,
                django_settings.DEFAULT_FROM_EMAIL,
                [inquiry.email],
                fail_silently=False,
            )
        except Exception as e:
            return Response({"error": f"Failed to send email: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Auto-mark as RESOLVED after reply
        inquiry.status = "RESOLVED"
        inquiry.save(update_fields=["status"])

        return Response({"message": "Reply sent successfully."}, status=status.HTTP_200_OK)


class DashboardView(APIView):
    permission_classes = [IsManagerOrAdmin]

    def get(self, request):
        today = timezone.now().date()

        data = {
            "total_customers": CustomUser.objects.filter(role="CUSTOMER").count(),
            "total_staff": Staff.objects.filter(is_active=True).count(),
            "total_services": Service.objects.filter(is_active=True).count(),
            "total_appointments": Appointment.objects.count(),
            "total_packages_sold": CustomerPackage.objects.count(),
            "today_appointments": Appointment.objects.filter(appointment_date=today).count(),
            "pending_appointments": Appointment.objects.filter(status="PENDING").count(),
            "total_revenue": Payment.objects.filter(status="SUCCESS").aggregate(
                total=Sum("amount")
            )["total"] or 0,
        }

        serializer = DashboardStatsSerializer(data)
        return Response(serializer.data)


class CustomerListView(generics.ListAPIView):
    serializer_class = CustomerListSerializer
    permission_classes = [IsManagerOrAdmin]

    def get_queryset(self):
        applications_subquery = AcademyApplication.objects.filter(student=OuterRef("pk"))
        enrollments_subquery = BatchStudent.objects.filter(student=OuterRef("pk"))
        return (
            CustomUser.objects.filter(role="CUSTOMER")
            .annotate(has_application=Exists(applications_subquery))
            .annotate(has_enrollment=Exists(enrollments_subquery))
            .order_by("-date_joined")
        )


class CustomerDetailView(generics.RetrieveAPIView):
    serializer_class = CustomerDetailSerializer
    permission_classes = [IsManagerOrAdmin]

    def get_queryset(self):
         return CustomUser.objects.filter(role="CUSTOMER").prefetch_related(
        "appointments", "packages", "payments",
        "applications", "batch_enrollments",
    )

class CustomerCreateView(generics.CreateAPIView):
    serializer_class = CustomerWriteSerializer
    permission_classes = [CustomerAccessPermission]

    def perform_create(self, serializer):
        serializer.save(role="CUSTOMER")


class CustomerUpdateView(generics.UpdateAPIView):
    serializer_class = CustomerWriteSerializer
    permission_classes = [CustomerAccessPermission]

    def get_queryset(self):
        return CustomUser.objects.filter(role="CUSTOMER")


class CustomerDeactivateView(APIView):
    permission_classes = [IsManagerOrAdmin]

    def post(self, request, pk):
        try:
            customer = CustomUser.objects.get(pk=pk, role="CUSTOMER")
        except CustomUser.DoesNotExist:
            return Response({"error": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)

        customer.is_active = not customer.is_active
        customer.save(update_fields=["is_active"])
        return Response({"id": customer.id, "is_active": customer.is_active})

class AdminServiceCategoryListView(generics.ListCreateAPIView):
    serializer_class = ServiceCategoryAdminSerializer
    permission_classes = [ServiceAccessPermission]
    queryset = ServiceCategory.objects.all().order_by("-created_at")


class AdminServiceCategoryDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ServiceCategoryAdminSerializer
    permission_classes = [ServiceAccessPermission]
    queryset = ServiceCategory.objects.all()


class AdminServiceCategoryDeactivateView(APIView):
    permission_classes = [IsManagerOrAdmin]

    def post(self, request, pk):
        try:
            category = ServiceCategory.objects.get(pk=pk)
        except ServiceCategory.DoesNotExist:
            return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)

        category.is_active = not category.is_active
        category.save(update_fields=["is_active"])
        return Response({"id": category.id, "is_active": category.is_active})


class AdminServiceListView(generics.ListCreateAPIView):
    serializer_class = ServiceSerializer
    permission_classes = [ServiceAccessPermission]
    parser_classes = [JSONParser, FormParser, MultiPartParser]
    queryset = Service.objects.all().select_related("category").order_by("-created_at")


class AdminServiceDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ServiceSerializer
    permission_classes = [ServiceAccessPermission]
    parser_classes = [JSONParser, FormParser, MultiPartParser]
    queryset = Service.objects.all().select_related("category")


class AdminServiceDeactivateView(APIView):
    permission_classes = [IsManagerOrAdmin]

    def post(self, request, pk):
        try:
            service = Service.objects.get(pk=pk)
        except Service.DoesNotExist:
            return Response({"error": "Service not found"}, status=status.HTTP_404_NOT_FOUND)

        service.is_active = not service.is_active
        service.save(update_fields=["is_active"])
        return Response({"id": service.id, "is_active": service.is_active})


class AdminPackageListView(generics.ListCreateAPIView):
    # Use PackageDetailSerializer for both list (to include benefits) and create
    serializer_class = PackageDetailSerializer
    permission_classes = [PackageAccessPermission]
    queryset = Package.objects.all().order_by("-created_at").prefetch_related("benefits__service")


class AdminPackageDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = PackageDetailSerializer
    permission_classes = [PackageAccessPermission]
    queryset = Package.objects.all().prefetch_related("benefits__service")


class AdminPackageDeactivateView(APIView):
    permission_classes = [IsManagerOrAdmin]

    def post(self, request, pk):
        try:
            package = Package.objects.get(pk=pk)
        except Package.DoesNotExist:
            return Response({"error": "Package not found"}, status=status.HTTP_404_NOT_FOUND)

        package.is_active = not package.is_active
        package.save(update_fields=["is_active"])
        return Response({"id": package.id, "is_active": package.is_active})

class AdminStaffListView(generics.ListCreateAPIView):
    serializer_class = AdminStaffSerializer
    permission_classes = [IsManagerOrAdmin]
    queryset = Staff.objects.select_related("user").order_by("-joined_at")


class AdminStaffDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = AdminStaffSerializer
    permission_classes = [IsManagerOrAdmin]
    queryset = Staff.objects.select_related("user")


class AdminStaffDeactivateView(APIView):
    permission_classes = [IsManagerOrAdmin]

    def post(self, request, pk):
        try:
            staff = Staff.objects.get(pk=pk)
        except Staff.DoesNotExist:
            return Response({"error": "Staff not found"}, status=status.HTTP_404_NOT_FOUND)

        staff.is_active = not staff.is_active
        staff.save(update_fields=["is_active"])
        return Response({"id": staff.id, "is_active": staff.is_active})


class AdminStaffServiceListView(generics.ListCreateAPIView):
    serializer_class = AdminStaffServiceSerializer
    permission_classes = [IsManagerOrAdmin]

    def get_queryset(self):
        return StaffService.objects.filter(staff_id=self.kwargs["staff_id"]).select_related("service", "staff")

    def perform_create(self, serializer):
        serializer.save(staff_id=self.kwargs["staff_id"])


class AdminStaffServiceDeleteView(generics.DestroyAPIView):
    serializer_class = StaffServiceSerializer
    permission_classes = [IsManagerOrAdmin]
    queryset = StaffService.objects.all()


class AdminStaffAvailabilityView(APIView):
    permission_classes = [IsManagerOrAdmin]

    def get(self, request, staff_id):
        availability = StaffAvailability.objects.filter(staff_id=staff_id).order_by("day_of_week")
        serializer = AdminStaffAvailabilitySerializer(availability, many=True)
        return Response(serializer.data)

    def post(self, request, staff_id):
        day_of_week = request.data.get("day_of_week")
        if day_of_week is None:
            return Response({"error": "day_of_week is required"}, status=status.HTTP_400_BAD_REQUEST)

        entry, _ = StaffAvailability.objects.update_or_create(
            staff_id=staff_id,
            day_of_week=day_of_week,
            defaults={
                "start_time": request.data.get("start_time"),
                "end_time": request.data.get("end_time"),
                "is_available": request.data.get("is_available", True),
            },
        )
        serializer = AdminStaffAvailabilitySerializer(entry)
        return Response(serializer.data)


class AdminStaffAvailabilityDeleteView(generics.DestroyAPIView):
    serializer_class = AdminStaffAvailabilitySerializer
    permission_classes = [IsManagerOrAdmin]
    queryset = StaffAvailability.objects.all()


class AdminStaffLeaveListView(generics.ListCreateAPIView):
    serializer_class = AdminStaffLeaveSerializer
    permission_classes = [IsManagerOrAdmin]

    def get_queryset(self):
        return StaffLeave.objects.filter(staff_id=self.kwargs["staff_id"]).order_by("-start_date")

    def perform_create(self, serializer):
        serializer.save(staff_id=self.kwargs["staff_id"])


class AdminStaffLeaveApproveView(APIView):
    permission_classes = [IsManagerOrAdmin]

    def post(self, request, pk):
        try:
            leave = StaffLeave.objects.get(pk=pk)
        except StaffLeave.DoesNotExist:
            return Response({"error": "Leave record not found"}, status=status.HTTP_404_NOT_FOUND)

        leave.is_approved = True
        leave.save(update_fields=["is_approved"])
        return Response({"id": leave.id, "is_approved": leave.is_approved})


class StaffListView(generics.ListAPIView):
    serializer_class = EligibleStaffUserSerializer
    permission_classes = [IsManagerOrAdmin]

    def get_queryset(self):
        return CustomUser.objects.filter(role__in=["STAFF", "TRAINER", "MANAGER"])


class AdminPaymentListView(generics.ListAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = Payment.objects.select_related("customer").order_by("-created_at")
        category = self.request.query_params.get("category")
        payment_type = self.request.query_params.get("payment_type")

        if category == "SALON":
            qs = qs.filter(payment_for__in=[Payment.PaymentFor.APPOINTMENT, Payment.PaymentFor.PACKAGE])
        elif category == "ACADEMY":
            qs = qs.filter(payment_for=Payment.PaymentFor.ACADEMY)

        if payment_type == "NON_PACKAGE":
            qs = qs.filter(payment_for=Payment.PaymentFor.APPOINTMENT)
        elif payment_type == "PACKAGE":
            qs = qs.filter(payment_for=Payment.PaymentFor.PACKAGE)
        elif payment_type == "COURSE_FEE":
            qs = qs.filter(payment_for=Payment.PaymentFor.ACADEMY)

        return qs


class AdminPaymentDetailView(generics.RetrieveAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return Payment.objects.select_related("customer")


class AdminPaymentUpdateView(generics.UpdateAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return Payment.objects.all()

class BaseReportView(APIView):
    permission_classes = [IsManagerOrAdmin]
    
    def get_date_range(self, request):
        period = request.query_params.get('period', 'all')
        today = timezone.now().date()
        
        if period == 'today':
            start_date = today
            end_date = today
        elif period == 'week':
            start_date = today - timedelta(days=7)
            end_date = today
        elif period == 'month':
            start_date = today.replace(day=1)
            end_date = today
        elif period == 'year':
            start_date = today.replace(month=1, day=1)
            end_date = today
        else:
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            if start_date:
                start_date = timezone.datetime.strptime(start_date, '%Y-%m-%d').date()
            if end_date:
                end_date = timezone.datetime.strptime(end_date, '%Y-%m-%d').date()
        
        return start_date, end_date, period
    
    def filter_by_date(self, queryset, date_field, start_date, end_date):
        if start_date and end_date:
            return queryset.filter(**{
                f'{date_field}__gte': start_date,
                f'{date_field}__lte': end_date,
            })
        elif start_date:
            return queryset.filter(**{f'{date_field}__gte': start_date})
        return queryset


class RevenueReportView(BaseReportView):
    def get(self, request):
        start_date, end_date, period = self.get_date_range(request)
        
        payments = Payment.objects.filter(status="SUCCESS")
        payments = self.filter_by_date(payments, 'created_at', start_date, end_date)
        
        total_revenue = payments.aggregate(total=Sum("amount"))["total"] or 0
        total_payments = payments.count()
        
        package_revenue = payments.filter(payment_for="PACKAGE").aggregate(total=Sum("amount"))["total"] or 0
        appointment_revenue = payments.filter(payment_for="APPOINTMENT").aggregate(total=Sum("amount"))["total"] or 0
        academy_revenue = payments.filter(payment_for="ACADEMY").aggregate(total=Sum("amount"))["total"] or 0
        
        refunded = Payment.objects.filter(status="REFUNDED")
        refunded = self.filter_by_date(refunded, 'updated_at', start_date, end_date)
        refunded_amount = refunded.aggregate(total=Sum("amount"))["total"] or 0
        daily_revenue = list(payments.annotate(
            day=TruncDate('created_at')
        ).values('day').annotate(amount=Sum('amount')).order_by('day'))
        
        data = {
            "period": period,
            "start_date": str(start_date) if start_date else None,
            "end_date": str(end_date) if end_date else None,
            "total_revenue": total_revenue,
            "total_payments": total_payments,
            "package_revenue": package_revenue,
            "appointment_revenue": appointment_revenue,
            "academy_revenue": academy_revenue,
            "refunded_amount": refunded_amount,
            "net_revenue": total_revenue - refunded_amount,
            "daily_breakdown": daily_revenue,
        }
        
        serializer = RevenueReportSerializer(data)
        return Response(serializer.data)

class AppointmentReportView(BaseReportView):
    def get(self, request):
        start_date, end_date, period = self.get_date_range(request)
        
        appointments = Appointment.objects.all()
        appointments = self.filter_by_date(appointments, 'appointment_date', start_date, end_date)
        
        total = appointments.count()
        completed = appointments.filter(status="COMPLETED").count()
        cancelled = appointments.filter(status="CANCELLED").count()
        pending = appointments.filter(status="PENDING").count()
        confirmed = appointments.filter(status="CONFIRMED").count()
        rescheduled = appointments.filter(status="RESCHEDULED").count()
        
        daily_appointments = list(appointments.values('appointment_date').annotate(
            count=Count('id')
        ).order_by('appointment_date'))
        
        status_breakdown = [
            {"name": "Completed", "value": completed},
            {"name": "Cancelled", "value": cancelled},
            {"name": "Pending", "value": pending},
            {"name": "Confirmed", "value": confirmed},
            {"name": "Rescheduled", "value": rescheduled},
        ]
        
        data = {
            "period": period,
            "start_date": str(start_date) if start_date else None,
            "end_date": str(end_date) if end_date else None,
            "total": total,
            "completed": completed,
            "cancelled": cancelled,
            "pending": pending,
            "confirmed": confirmed,
            "rescheduled": rescheduled,
            "daily_breakdown": daily_appointments,
            "status_breakdown": status_breakdown,
        }
        
        return Response(data)


class CustomerReportView(BaseReportView):
    def get(self, request):
        start_date, end_date, period = self.get_date_range(request)
        
        customers = CustomUser.objects.filter(role="CUSTOMER")
        
        total_customers = customers.count()
        
        new_customers = customers
        new_customers = self.filter_by_date(new_customers, 'date_joined', start_date, end_date)
        new_count = new_customers.count()
        
        active = customers.filter(is_active=True).count()
        inactive = customers.filter(is_active=False).count()
        
        academy_students = customers.filter(
            Q(applications__status="APPROVED") | Q(batch_enrollments__isnull=False)
        ).distinct().count()
        
    
        daily_new = list(new_customers.annotate(
            day=TruncDate('date_joined')
        ).values('day').annotate(count=Count('id')).order_by('day'))
        
        data = {
            "period": period,
            "start_date": str(start_date) if start_date else None,
            "end_date": str(end_date) if end_date else None,
            "total_customers": total_customers,
            "new_customers": new_count,
            "active_customers": active,
            "inactive_customers": inactive,
            "academy_students": academy_students,
            "daily_new": daily_new,
        }
        
        return Response(data)


class ServiceReportView(BaseReportView):
    def get(self, request):
        start_date, end_date, period = self.get_date_range(request)
        
        services = Service.objects.filter(is_active=True)
        
        service_stats = []
        for service in services:
            appt_services = AppointmentService.objects.filter(
                service=service,
                appointment__status="COMPLETED"
            )
            if start_date and end_date:
                appt_services = appt_services.filter(
                    appointment__appointment_date__gte=start_date,
                    appointment__appointment_date__lte=end_date
                )
            
            appointment_count = appt_services.count()
            total_revenue = appt_services.aggregate(total=Sum('price_at_booking'))["total"] or 0
            
            service_stats.append({
                "id": service.id,
                "name": service.name,
                "category": service.category.name,
                "appointment_count": appointment_count,
                "revenue": total_revenue,
            })
        
        service_stats.sort(key=lambda x: x['revenue'], reverse=True)
        
        data = {
            "period": period,
            "start_date": str(start_date) if start_date else None,
            "end_date": str(end_date) if end_date else None,
            "total_services": services.count(),
            "top_services": service_stats[:10],
        }
        
        return Response(data)


class PackageReportView(BaseReportView):
    def get(self, request):
        start_date, end_date, period = self.get_date_range(request)
        
        packages = Package.objects.all()
        
        total_sold = CustomerPackage.objects.count()
        
        sold_in_period = CustomerPackage.objects.all()
        sold_in_period = self.filter_by_date(sold_in_period, 'purchase_date', start_date, end_date)
        period_sold = sold_in_period.count()
        
        package_revenue = Payment.objects.filter(
            status="SUCCESS",
            payment_for="PACKAGE"
        )
        package_revenue = self.filter_by_date(package_revenue, 'created_at', start_date, end_date)
        revenue = package_revenue.aggregate(total=Sum("amount"))["total"] or 0
        
        package_breakdown = []
        for pkg in packages:
            sold_count = CustomerPackage.objects.filter(package=pkg).count()
            package_breakdown.append({
                "id": pkg.id,
                "name": pkg.name,
                "type": pkg.package_type,
                "price": pkg.price,
                "sold_count": sold_count,
            })
        
        data = {
            "period": period,
            "start_date": str(start_date) if start_date else None,
            "end_date": str(end_date) if end_date else None,
            "total_sold": total_sold,
            "period_sold": period_sold,
            "revenue": revenue,
            "package_breakdown": package_breakdown,
        }
        
        return Response(data)

class AcademyDashboardView(APIView):
    permission_classes = [IsTrainer]

    def get(self, request):
        data = {
            "total_courses": Course.objects.filter(is_active=True).count(),
            "total_batches": Batch.objects.filter(status=Batch.Status.ACTIVE).count(),
            "total_students": BatchStudent.objects.count(),
            "total_applications": AcademyApplication.objects.count(),
            "pending_applications": AcademyApplication.objects.filter(status="PENDING").count(),
            "approved_applications": AcademyApplication.objects.filter(status="APPROVED").count(),
        }

        serializer = AcademyStatsSerializer(data)
        return Response(serializer.data)


class ApplicationStatusUpdateView(APIView):
    permission_classes = [IsManagerOrAdmin]

    def patch(self, request, pk):
        application = get_object_or_404(AcademyApplication, pk=pk)

        if application.status not in (
            AcademyApplication.Status.PENDING,
            AcademyApplication.Status.AWAITING_RESPONSE,
        ):
            return Response(
                {"error": "Only pending or awaiting-response applications can be rejected."},
                status=status.HTTP_400_BAD_REQUEST
            )

        new_status = request.data.get("status")

        if new_status != AcademyApplication.Status.REJECTED:
            return Response(
                {"error": "This endpoint can only reject applications."},
                status=status.HTTP_400_BAD_REQUEST
            )

        application.status = AcademyApplication.Status.REJECTED
        application.reviewed_at = timezone.now()
        application.save(update_fields=["status", "reviewed_at"])

        return Response(
            ApplicationStatusUpdateSerializer(application).data,
            status=status.HTTP_200_OK
        )


class ManageApplicationsView(generics.ListAPIView):
    permission_classes = [IsManagerOrAdmin]

    def get_queryset(self):
        return AcademyApplication.objects.all().order_by("-applied_at")

    def get_serializer_class(self):
        from academy.serializers import AcademyApplicationSerializer
        return AcademyApplicationSerializer


class ApproveApplicationView(APIView):
    permission_classes = [IsManagerOrAdmin]

    def post(self, request, pk):
        try:
            with transaction.atomic():
                application = AcademyApplication.objects.select_for_update().select_related(
                    'student',
                    'course'
                ).get(
                    pk=pk,
                    status__in=[
                        AcademyApplication.Status.PENDING,
                        AcademyApplication.Status.AWAITING_RESPONSE,
                    ]
                )

                batch_id = request.data.get('batch_id')

                batch = None

                if batch_id:
                    try:
                        batch = Batch.objects.select_for_update().select_related(
                            'course'
                        ).get(
                            pk=batch_id,
                            status=Batch.Status.ACTIVE,
                            is_active=True
                        )
                    except Batch.DoesNotExist:
                        return Response(
                            {
                                "error": "Selected batch not found or inactive"
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    if batch.course_id != application.course_id:
                        return Response(
                            {
                                "error": "Selected batch does not belong to the applied course"
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    if BatchStudent.objects.filter(
                        student=application.student,
                        batch__course_id=batch.course_id
                    ).exists():
                        return Response(
                            {
                                "error": "Student is already enrolled in this course"
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    current_students = BatchStudent.objects.filter(
                        batch=batch
                    ).count()

                    if current_students >= batch.capacity:
                        return Response(
                            {
                                "error": "Batch is full"
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )

                application.status = AcademyApplication.Status.APPROVED
                application.reviewed_at = timezone.now()
                application.save(
                    update_fields=['status', 'reviewed_at']
                )

                if batch:
                    from academy.views import _create_enrollment_fee

                    BatchStudent.objects.create(
                        batch=batch,
                        student=application.student
                    )
                    _create_enrollment_fee(application.student, batch)

            if batch:
                return Response(
                    {
                        "message": "Application approved and student enrolled"
                    }
                )

            return Response(
                {
                    "message": "Application approved and awaiting batch assignment"
                }
            )

        except AcademyApplication.DoesNotExist:
            return Response(
                {
                    "error": "Application not found or already processed"
                },
                status=status.HTTP_404_NOT_FOUND
            )

class ApplicationDetailView(generics.RetrieveAPIView):
    permission_classes = [IsManagerOrAdmin]
    
    def get_queryset(self):
        return AcademyApplication.objects.all().select_related("student", "course")
    
    def get_serializer_class(self):
        from academy.serializers import AcademyApplicationSerializer
        return AcademyApplicationSerializer

from accounts.permissions import IsManagerOrAdmin, IsStaffMember

class AdminAppointmentListView(generics.ListCreateAPIView):
    permission_classes = [IsStaffMember] 
    queryset = Appointment.objects.all().order_by("-appointment_date", "-start_time")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return AdminAppointmentWriteSerializer
        return AppointmentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "STAFF":
            return Appointment.objects.filter(
                staff__user=user
            ).order_by("-appointment_date", "-start_time")
        return Appointment.objects.all().order_by("-appointment_date", "-start_time")



class AdminAppointmentUpdateView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsStaffMember]  # STAFF, MANAGER, ADMIN
    queryset = Appointment.objects.all()

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return AdminAppointmentWriteSerializer
        return AppointmentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "STAFF":
            return Appointment.objects.filter(staff__user=user)
        return Appointment.objects.all()

    def perform_update(self, serializer):
        user = self.request.user
        instance = self.get_object()

        if user.role == "STAFF":
            new_status = serializer.validated_data.get("status")
            if new_status and new_status not in ("COMPLETED", "RESCHEDULED"):
                raise PermissionDenied(
                    "Staff can only mark appointments as COMPLETED or RESCHEDULED"
                )
            if "staff" in serializer.validated_data:
                raise PermissionDenied("Staff cannot reassign appointments")
            if "customer" in serializer.validated_data:
                raise PermissionDenied("Staff cannot change customer")

        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if user.role == "STAFF":
            raise PermissionDenied("Staff cannot delete appointments")
        instance.delete()


class UserAccountListView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    queryset = CustomUser.objects.exclude(role="CUSTOMER").order_by("-date_joined")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserAccountCreateSerializer
        return UserAccountListSerializer


class UserAccountRoleUpdateView(generics.UpdateAPIView):
    serializer_class = UserAccountRoleUpdateSerializer
    permission_classes = [IsAdmin]
    queryset = CustomUser.objects.exclude(role="CUSTOMER")


class AdminSalaryListView(generics.ListCreateAPIView):
    serializer_class = SalarySerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = Salary.objects.select_related('employee').order_by('-month')
        role = self.request.query_params.get('role')
        employee_id = self.request.query_params.get('employee_id')
        status_filter = self.request.query_params.get('status')
        
        if role:
            qs = qs.filter(employee__role=role)
        if employee_id:
            try:
                employee_uuid = uuid.UUID(employee_id)
                qs = qs.filter(employee_id=employee_uuid)
            except ValueError:
                pass
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

class AdminSalaryMarkPaidView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            salary = Salary.objects.get(pk=pk)
        except Salary.DoesNotExist:
            return Response({"error": "Salary record not found"}, status=status.HTTP_404_NOT_FOUND)

        salary.status = Salary.Status.PAID
        salary.paid_date = timezone.now().date()
        salary.save(update_fields=['status', 'paid_date'])

        serializer = SalarySerializer(salary)
        return Response(serializer.data)

class AdminSalaryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SalarySerializer
    permission_classes = [IsAdmin]
    queryset = Salary.objects.all()