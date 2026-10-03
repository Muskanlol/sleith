import razorpay
from decimal import Decimal
from django.conf import settings
from django.db import transaction
from rest_framework import status
from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authentication import SessionAuthentication
from accounts.permissions import IsAdmin
from .serializers import PaymentSerializer
from .models import (
    Service,
    ServiceCategory,
    Staff,
    StaffService,
    StaffAvailability,
    Package,
    CustomerPackage,
    PackageUsage,
    Appointment,
    Payment,
    Review,
)
from academy.models import AcademyFee
from accounts.permissions import IsManagerOrAdmin
from .serializers import (
    ServiceSerializer,
    ServiceCategorySerializer,
    StaffSerializer,
    PackageSerializer,
    PackageDetailSerializer,
    CustomerPackageSerializer,
    PackageUsageSerializer,
    AppointmentSerializer,
    CustomerAppointmentCreateSerializer,
    PublicReviewSerializer,
    ReviewWriteSerializer,
    ReviewUpdateSerializer,
    AdminReviewSerializer,
    _validate_appointment_business_rules,
)
from django.utils.dateparse import parse_date, parse_time
from datetime import datetime, timedelta
from django.utils import timezone
from rest_framework import serializers as drf_serializers


class ServiceListView(generics.ListAPIView):
    authentication_classes = []
    queryset = Service.objects.filter(is_active=True).select_related("category")
    serializer_class = ServiceSerializer
    permission_classes = [AllowAny]


class ServiceDetailView(generics.RetrieveAPIView):
    authentication_classes = []
    queryset = Service.objects.filter(is_active=True).select_related("category")
    serializer_class = ServiceSerializer
    permission_classes = [AllowAny]


class CategoryListView(generics.ListAPIView):
    authentication_classes = []
    queryset = ServiceCategory.objects.filter(is_active=True)
    serializer_class = ServiceCategorySerializer
    permission_classes = [AllowAny]


class StaffListView(generics.ListAPIView):
    authentication_classes = []
    queryset = Staff.objects.filter(is_active=True)
    serializer_class = StaffSerializer
    permission_classes = [AllowAny]


class StaffDetailView(generics.RetrieveAPIView):
    authentication_classes = []
    queryset = Staff.objects.filter(is_active=True)
    serializer_class = StaffSerializer
    permission_classes = [AllowAny]


class StaffServicesView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, pk):
        staff = get_object_or_404(Staff, pk=pk, is_active=True)
        staff_services = StaffService.objects.filter(staff=staff)
        services = [ss.service for ss in staff_services]
        serializer = ServiceSerializer(services, many=True, context={"request": request})
        return Response(serializer.data)


class ServiceStaffView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, pk):
        service = get_object_or_404(Service, pk=pk, is_active=True)
        staff_services = StaffService.objects.filter(service=service)
        staff_list = [ss.staff for ss in staff_services]
        serializer = StaffSerializer(staff_list, many=True, context={"request": request})
        return Response(serializer.data)


class StaffAvailabilityView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, pk):
        staff = get_object_or_404(Staff, pk=pk, is_active=True)
        availability = StaffAvailability.objects.filter(staff=staff, is_available=True)
        data = [
            {
                "day": av.get_day_of_week_display(),
                "start_time": av.start_time.strftime("%H:%M"),
                "end_time": av.end_time.strftime("%H:%M"),
            }
            for av in availability
        ]
        return Response(data)


class PackageListView(generics.ListAPIView):
    authentication_classes = []
    queryset = Package.objects.filter(is_active=True)
    serializer_class = PackageSerializer
    permission_classes = [AllowAny]


class PackageDetailView(generics.RetrieveAPIView):
    authentication_classes = []
    queryset = Package.objects.filter(is_active=True)
    serializer_class = PackageDetailSerializer
    permission_classes = [AllowAny]


class MyPackagesView(generics.ListAPIView):
    serializer_class = CustomerPackageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CustomerPackage.objects.filter(
            customer=self.request.user,
        ).select_related(
            "package",
        ).prefetch_related(
            "package__benefits__service",
            "usages__service",
        )


class MyPackageUsageView(generics.ListAPIView):
    serializer_class = PackageUsageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        customer_package_id = self.kwargs.get("pk")
        return PackageUsage.objects.filter(
            customer_package__id=customer_package_id,
            customer_package__customer=self.request.user,
        ).select_related("service").order_by("-used_at")


def _customer_appointments(user):
    return Appointment.objects.filter(customer=user).select_related(
        "review", "staff__user",
    ).prefetch_related("services__service")


class AppointmentListView(generics.ListAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _customer_appointments(self.request.user)


class AppointmentDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]
    queryset = Appointment.objects.all()

    def get_queryset(self):
        return _customer_appointments(self.request.user)


CHANGEABLE_STATUSES = (
    Appointment.Status.PENDING,
    Appointment.Status.CONFIRMED,
    Appointment.Status.RESCHEDULED,
)


def _appointment_starts_at(appointment):
    naive = datetime.combine(appointment.appointment_date, appointment.start_time)
    if timezone.is_naive(naive):
        return timezone.make_aware(naive, timezone.get_current_timezone())
    return naive


def _can_customer_change(appointment):
    if appointment.status not in CHANGEABLE_STATUSES:
        return False, "This appointment can no longer be changed."
    if timezone.now() > _appointment_starts_at(appointment) - timedelta(hours=4):
        return False, "Changes must be made at least 4 hours before the appointment."
    return True, None


def _restore_package_sessions(appointment):
    for row in appointment.services.filter(is_package_used=True).select_related("service"):
        pkgs = CustomerPackage.objects.filter(
            customer=appointment.customer,
            package__benefits__service=row.service,
            usages__service=row.service,
        ).distinct().prefetch_related("usages", "package__benefits")
        for pkg in pkgs:
            if pkg.restore_service(row.service):
                break


class AppointmentCancelView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        appointment = get_object_or_404(
            _customer_appointments(request.user),
            pk=pk,
        )
        ok, message = _can_customer_change(appointment)
        if not ok:
            return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)

        _restore_package_sessions(appointment)
        appointment.status = Appointment.Status.CANCELLED
        appointment.save(update_fields=["status", "updated_at"])
        return Response(AppointmentSerializer(appointment, context={"request": request}).data)


class AppointmentRescheduleView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        appointment = get_object_or_404(
            _customer_appointments(request.user).select_related("staff"),
            pk=pk,
        )
        ok, message = _can_customer_change(appointment)
        if not ok:
            return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)

        appointment_date = parse_date(str(request.data.get("appointment_date") or ""))
        start_time = parse_time(str(request.data.get("start_time") or ""))
        end_time = parse_time(str(request.data.get("end_time") or ""))
        if not appointment_date or not start_time or not end_time:
            return Response(
                {"error": "appointment_date, start_time, and end_time are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        services = [row.service for row in appointment.services.all()]
        try:
            _validate_appointment_business_rules(
                appointment.staff,
                services,
                appointment_date,
                start_time,
                end_time,
                exclude_pk=appointment.pk,
            )
        except drf_serializers.ValidationError as exc:
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)

        appointment.appointment_date = appointment_date
        appointment.start_time = start_time
        appointment.end_time = end_time
        appointment.status = Appointment.Status.RESCHEDULED
        appointment.save(update_fields=[
            "appointment_date", "start_time", "end_time", "status", "updated_at",
        ])
        return Response(AppointmentSerializer(appointment, context={"request": request}).data)


class ReviewCreateView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ReviewWriteSerializer


class MyReviewUpdateView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ReviewUpdateSerializer

    def get_queryset(self):
        return Review.objects.filter(
            customer=self.request.user,
            status__in=[Review.Status.PENDING, Review.Status.REJECTED],
        )


class PublicReviewListView(generics.ListAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = PublicReviewSerializer

    def get_queryset(self):
        qs = Review.objects.filter(status=Review.Status.APPROVED).select_related(
            "customer", "staff__user", "appointment",
        ).prefetch_related("appointment__services__service")
        staff_id = self.request.query_params.get("staff")
        service_id = self.request.query_params.get("service")
        if staff_id:
            qs = qs.filter(staff_id=staff_id)
        if service_id:
            qs = qs.filter(appointment__services__service_id=service_id).distinct()
        return qs


class AdminReviewListView(generics.ListAPIView):
    permission_classes = [IsManagerOrAdmin] 
    serializer_class = AdminReviewSerializer

    def get_queryset(self):
        qs = Review.objects.select_related(
            "customer", "staff__user", "appointment",
        ).prefetch_related("appointment__services__service")
        status_filter = self.request.query_params.get("status")
        staff_id = self.request.query_params.get("staff")
        rating = self.request.query_params.get("rating")
        if status_filter:
            qs = qs.filter(status=status_filter)
        if staff_id:
            qs = qs.filter(staff_id=staff_id)
        if rating:
            qs = qs.filter(rating=rating)
        return qs


class AdminReviewStatusView(APIView):
    permission_classes = [IsManagerOrAdmin]

    def patch(self, request, pk):
        review = get_object_or_404(Review, pk=pk)
        new_status = request.data.get("status")
        if new_status not in (Review.Status.APPROVED, Review.Status.REJECTED, Review.Status.PENDING):
            return Response(
                {"error": "status must be APPROVED, REJECTED, or PENDING."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        review.status = new_status
        review.save(update_fields=["status", "updated_at"])
        return Response(AdminReviewSerializer(review).data)


class AppointmentCreateView(generics.CreateAPIView):
    serializer_class = CustomerAppointmentCreateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)


class CreateOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        payment_for = request.data.get("payment_for")
        payment_kwargs = {}

        if payment_for == Payment.PaymentFor.PACKAGE:
            package_id = request.data.get("package_id")
            try:
                package = Package.objects.get(pk=package_id, is_active=True)
            except Package.DoesNotExist:
                return Response({"error": "Package not found"}, status=status.HTTP_404_NOT_FOUND)
            amount = package.price
            payment_kwargs["package"] = package

        elif payment_for == Payment.PaymentFor.APPOINTMENT:
            appointment_id = request.data.get("appointment_id")
            appointment = get_object_or_404(Appointment, pk=appointment_id, customer=request.user)

            if Payment.objects.filter(appointment=appointment, status=Payment.Status.SUCCESS).exists():
                return Response({"error": "This appointment has already been paid for."}, status=status.HTTP_400_BAD_REQUEST)

            amount = sum((s.price_at_booking for s in appointment.services.all()), start=Decimal('0'))
            if not amount or amount <= 0:
                return Response({"error": "Appointment has no billable services."}, status=status.HTTP_400_BAD_REQUEST)
            payment_kwargs["appointment"] = appointment

        elif payment_for == Payment.PaymentFor.ACADEMY:
            fee_id = request.data.get("academy_fee_id")
            fee = get_object_or_404(AcademyFee, pk=fee_id, student=request.user)

            if fee.status == AcademyFee.Status.PAID:
                return Response({"error": "This fee has already been paid."}, status=status.HTTP_400_BAD_REQUEST)

            amount = fee.amount
            payment_kwargs["academy_fee"] = fee

        else:
            return Response(
                {"error": "payment_for must be one of PACKAGE, APPOINTMENT, ACADEMY."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        amount_in_paise = int(amount * 100)

        try:
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            # Razorpay receipt must be ≤ 56 chars — use short hash to stay safe
            ref_id  = request.data.get('package_id') or request.data.get('appointment_id') or request.data.get('academy_fee_id')
            receipt = f"rcpt_{payment_for[:4].lower()}_{ref_id}_{str(request.user.pk)[:8]}"[:56]
            order = client.order.create(data={
                "amount": amount_in_paise,
                "currency": "INR",
                "receipt": receipt,
            })
        except Exception as e:
            import traceback
            return Response(
                {"error": f"Payment gateway error: {str(e)}", "detail": traceback.format_exc()},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        Payment.objects.create(
            customer=request.user,
            amount=amount,
            payment_for=payment_for,
            gateway_order_id=order["id"],
            status=Payment.Status.PENDING,
            **payment_kwargs,
        )

        return Response({
            "order_id": order["id"],
            "amount": amount_in_paise,
            "currency": "INR",
            "key": settings.RAZORPAY_KEY_ID,
        })


class VerifyPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        razorpay_order_id = request.data.get("razorpay_order_id")
        razorpay_payment_id = request.data.get("razorpay_payment_id")
        razorpay_signature = request.data.get("razorpay_signature")

        if not razorpay_order_id or not razorpay_payment_id or not razorpay_signature:
            return Response(
                {"error": "razorpay_order_id, razorpay_payment_id and razorpay_signature are all required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            payment = Payment.objects.select_for_update().get(
                gateway_order_id=razorpay_order_id
            )
        except Payment.DoesNotExist:
            return Response(
                {"error": "Order not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if payment.customer_id != request.user.id:
            return Response(
                {"error": "This order does not belong to the current user."},
                status=status.HTTP_403_FORBIDDEN
            )

        if payment.status == Payment.Status.SUCCESS:
            return Response({
                "message": "Payment already verified",
                "payment_id": payment.id,
                "status": payment.status
            })

        if payment.status != Payment.Status.PENDING:
            return Response(
                {
                    "error": (
                        f"Order is not in a verifiable state "
                        f"(current status: {payment.status})."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

        try:
            client.utility.verify_payment_signature({
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_signature": razorpay_signature,
            })
        except razorpay.errors.SignatureVerificationError:
            payment.status = Payment.Status.FAILED
            payment.save(update_fields=["status"])
            return Response(
                {"error": "Payment signature verification failed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        payment.status = Payment.Status.SUCCESS
        payment.gateway_payment_id = razorpay_payment_id
        payment.gateway_signature = razorpay_signature
        payment.save(update_fields=["status", "gateway_payment_id", "gateway_signature"])

        if (
            payment.payment_for == Payment.PaymentFor.PACKAGE
            and payment.package
            and not payment.customer_package
        ):
            expiry_date = timezone.now() + timedelta(days=payment.package.validity_days)
            customer_package = CustomerPackage.objects.create(
                customer=payment.customer,
                package=payment.package,
                expiry_date=expiry_date,
                status=CustomerPackage.Status.ACTIVE,
            )
            payment.customer_package = customer_package
            payment.save(update_fields=["customer_package"])

        elif payment.payment_for == Payment.PaymentFor.APPOINTMENT and payment.appointment:
            appointment = payment.appointment
            if appointment.status == Appointment.Status.PENDING:
                appointment.status = Appointment.Status.CONFIRMED
                appointment.save(update_fields=["status"])

        elif payment.payment_for == Payment.PaymentFor.ACADEMY and payment.academy_fee:
            fee = payment.academy_fee
            fee.status = AcademyFee.Status.PAID
            fee.paid_date = timezone.now().date()
            fee.save(update_fields=["status", "paid_date"])

        return Response({
            "message": "Payment verified successfully",
            "payment_id": payment.id,
            "status": payment.status
        })


class PaymentCreateAPIView(generics.CreateAPIView):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAdmin]

class PaymentDeleteAPIView(generics.DestroyAPIView):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAdmin]