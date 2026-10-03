from datetime import timedelta

from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from django.db.models import Q
from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import JSONParser, FormParser, MultiPartParser
import uuid
from django.utils import timezone
from django.conf import settings

from accounts.permissions import IsManagerOrAdmin, IsTrainer, IsAdmin, TrainerWriteReadOnlyOthers
from accounts.models import CustomUser

from .models import (
    Course,
    CourseModule,
    Batch,
    AcademyApplication,
    BatchStudent,
    AcademyFee,
    AcademySession,
    Attendance,
    Assessment,
    AssessmentResult,
    PracticalSession,
    PracticalEvaluation,
    Certificate,
    PracticalEvaluationCriteria,
    PracticalEvaluationScore,
    PRACTICAL_PASS_PERCENTAGE
)

from .serializers import (
    CourseSerializer,
    CourseModuleSerializer,
    BatchSerializer,
    AcademyApplicationSerializer,
    BatchStudentSerializer,
    AcademyFeeSerializer,
    AcademySessionSerializer,
    AttendanceSerializer,
    AssessmentSerializer,
    AssessmentResultSerializer,
    PracticalSessionSerializer,
    PracticalEvaluationSerializer,
    CertificateSerializer,
    PracticalEvaluationCreateSerializer,
    PracticalEvaluationCriteriaSerializer,
    AdminAcademyFeeSerializer
)

from management.serializers import (
    UserAccountCreateSerializer,
    UserAccountListSerializer
)


def _academy_role_permissions(request):
    user = request.user

    if not user or not user.is_authenticated:
        return [IsAuthenticated()]

    if user.role == "TRAINER":
        return [IsTrainer()]

    return [IsManagerOrAdmin()]



def _create_enrollment_fee(student, batch):
    existing = AcademyFee.objects.filter(
        student=student,
        batch=batch
    ).first()

    if existing:
        return existing

    return AcademyFee.objects.create(
        student=student,
        batch=batch,
        amount=batch.course.fee,
        due_date=timezone.now().date() + timedelta(days=settings.ACADEMY_FEE_DUE_DAYS), 
        status=AcademyFee.Status.PENDING,
    )


def _assert_trainer_owns_batch(user, batch):
    if user.role == "TRAINER" and batch.trainer_id != user.id:
        raise PermissionDenied("You are not assigned to this batch.")


def _assert_trainer_owns_session(user, session):
    if user.role == "TRAINER" and session.trainer_id != user.id:
        raise PermissionDenied("You are not assigned to this session.")


def _validate_session_against_batch(batch, module, session_date):
    if module and module.course_id != batch.course_id:
        raise ValidationError({
            "module": "Selected module does not belong to this batch's course."
        })

    if session_date and (
        session_date < batch.start_date or session_date > batch.end_date
    ):
        raise ValidationError({
            "date": (
                f"Session date must fall between {batch.start_date} "
                f"and {batch.end_date}."
            )
        })


def _future_exam_marks_error(exam_date, kind):
    if exam_date and exam_date > timezone.now().date():
        return (
            f"Cannot enter {kind} before {exam_date}. "
            "Marks can be saved on that date or after."
        )
    return None


class CourseListView(generics.ListAPIView):
    queryset = Course.objects.filter(is_active=True)
    serializer_class = CourseSerializer
    permission_classes = [AllowAny]


class CourseDetailView(generics.RetrieveAPIView):
    queryset = Course.objects.filter(is_active=True)
    serializer_class = CourseSerializer
    permission_classes = [AllowAny]


class CourseModuleListView(generics.ListAPIView):
    serializer_class = CourseModuleSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        course_id = self.kwargs.get("course_id")
        return CourseModule.objects.filter(
            course_id=course_id,
            course__is_active=True
        )


class BatchListView(generics.ListAPIView):
    queryset = Batch.objects.filter(is_active=True)
    serializer_class = BatchSerializer
    permission_classes = [AllowAny]


class BatchDetailView(generics.RetrieveAPIView):
    queryset = Batch.objects.filter(is_active=True)
    serializer_class = BatchSerializer
    permission_classes = [AllowAny]


class AcademyApplicationCreateView(generics.CreateAPIView):
    serializer_class = AcademyApplicationSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        course = serializer.validated_data.get("course")
        student = self.request.user

        if student.role != "CUSTOMER":
            raise PermissionDenied("Only students can submit academy applications.")

        if not course:
            raise PermissionDenied("Course is required.")

        if not course.is_active:
            raise PermissionDenied("Applications cannot be submitted for an inactive course.")

        existing_active = AcademyApplication.objects.filter(
            student=student,
            course=course,
            status__in=[
                AcademyApplication.Status.PENDING,
                AcademyApplication.Status.AWAITING_RESPONSE,
                AcademyApplication.Status.APPROVED,
            ]
        ).exists()

        if existing_active:
            raise PermissionDenied(
                "You already have an active application for this course."
            )

        serializer.save(student=student)


class MyApplicationsView(generics.ListAPIView):
    serializer_class = AcademyApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AcademyApplication.objects.filter(student=self.request.user)


class CustomerRespondView(APIView):
    """
    Customer responds Yes/No to an admin note on their application.
    POST { "response": "ACCEPTED" | "DECLINED" }
    - ACCEPTED  → status stays AWAITING_RESPONSE (admin will then approve)
    - DECLINED  → application auto-rejected
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            application = AcademyApplication.objects.get(
                pk=pk,
                student=request.user,
                status=AcademyApplication.Status.AWAITING_RESPONSE,
            )
        except AcademyApplication.DoesNotExist:
            return Response(
                {"error": "Application not found or not awaiting your response."},
                status=status.HTTP_404_NOT_FOUND,
            )

        response_val = request.data.get("response")
        if response_val not in (
            AcademyApplication.CustomerResponse.ACCEPTED,
            AcademyApplication.CustomerResponse.DECLINED,
        ):
            return Response(
                {"error": "response must be ACCEPTED or DECLINED."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        application.customer_response = response_val
        application.customer_response_at = timezone.now()

        if response_val == AcademyApplication.CustomerResponse.DECLINED:
            application.status = AcademyApplication.Status.REJECTED
            application.reviewed_at = timezone.now()

        application.save()
        return Response(AcademyApplicationSerializer(application).data)


class AdminNotifyApplicantView(APIView):
    """
    Admin/Manager sends a note to the customer and sets status to AWAITING_RESPONSE.
    POST { "note": "We don't have afternoon batches right now..." }
    """
    permission_classes = [IsManagerOrAdmin]

    def post(self, request, pk):
        note = request.data.get("note", "").strip()
        if not note:
            return Response(
                {"error": "note is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            application = AcademyApplication.objects.get(
                pk=pk,
                status__in=[
                    AcademyApplication.Status.PENDING,
                    AcademyApplication.Status.AWAITING_RESPONSE,
                ],
            )
        except AcademyApplication.DoesNotExist:
            return Response(
                {"error": "Application not found or already resolved."},
                status=status.HTTP_404_NOT_FOUND,
            )

        application.admin_note = note
        application.status = AcademyApplication.Status.AWAITING_RESPONSE
        application.customer_response = None          # reset previous response
        application.customer_response_at = None
        application.save()
        return Response(AcademyApplicationSerializer(application).data)


class MyEnrollmentsView(generics.ListAPIView):
    serializer_class = BatchStudentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BatchStudent.objects.filter(
            student=self.request.user
        ).select_related(
            "batch",
            "batch__course",
            "batch__trainer",
            "student",
        ).order_by("-enrolled_at")


class MyFeesView(generics.ListAPIView):
    serializer_class = AcademyFeeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        enrollments = BatchStudent.objects.filter(
            student=self.request.user
        ).select_related("student", "batch", "batch__course")
        for enrollment in enrollments:
            _create_enrollment_fee(enrollment.student, enrollment.batch)
        return AcademyFee.objects.filter(student=self.request.user)


class MyAttendanceView(generics.ListAPIView):
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Attendance.objects.filter(
            student=self.request.user
        ).select_related(
            "session",
            "session__batch",
            "session__batch__course",
        ).order_by("-session__date", "-session__start_time")


class MyResultsView(generics.ListAPIView):
    serializer_class = AssessmentResultSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AssessmentResult.objects.filter(
            student=self.request.user
        ).select_related(
            "assessment",
            "assessment__batch",
            "assessment__batch__course",
        ).order_by("-assessment__date")


class MyCertificatesView(generics.ListAPIView):
    serializer_class = CertificateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Certificate.objects.filter(
            student=self.request.user,
        ).exclude(
            status=Certificate.Status.DRAFT,
        ).select_related(
            "course",
            "batch",
            "student",
        )


class MyPracticalsView(generics.ListAPIView):
    serializer_class = PracticalSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PracticalSession.objects.filter(
            student=self.request.user,
        ).select_related(
            "batch",
            "batch__course",
            "trainer",
        ).prefetch_related(
            "evaluation__scores__criteria",
        ).order_by("-date")


class AdminStudentListView(APIView):
    def get_permissions(self):
        return _academy_role_permissions(self.request)

    def get(self, request):
        user = request.user
        search = request.query_params.get('search')
        batch_id = request.query_params.get('batch_id')
        course_id = request.query_params.get('course_id')

        if user.role == 'TRAINER':
            trainer_batches = Batch.objects.filter(trainer=user)

            enrolled_qs = BatchStudent.objects.filter(
                batch__in=trainer_batches
            ).select_related(
                'student',
                'batch',
                'batch__course'
            ).order_by('-enrolled_at')

            return Response({
                "enrolled": BatchStudentSerializer(
                    enrolled_qs,
                    many=True
                ).data,
                "pending_assignment": [],
            })

        enrolled_qs = BatchStudent.objects.all().select_related(
            'student',
            'batch',
            'batch__course'
        ).order_by('-enrolled_at')

        if batch_id:
            enrolled_qs = enrolled_qs.filter(batch_id=batch_id)

        if course_id:
            enrolled_qs = enrolled_qs.filter(batch__course_id=course_id)

        if search:
            enrolled_qs = enrolled_qs.filter(
                Q(student__full_name__icontains=search) |
                Q(student__email__icontains=search) |
                Q(student__phone__icontains=search)
            )

        enrolled_data = BatchStudentSerializer(
            enrolled_qs,
            many=True
        ).data

        pending_qs = AcademyApplication.objects.filter(
            status=AcademyApplication.Status.APPROVED
        ).select_related(
            'student',
            'course'
        ).order_by('-reviewed_at')

        if course_id:
            pending_qs = pending_qs.filter(course_id=course_id)

        if search:
            pending_qs = pending_qs.filter(
                Q(student__full_name__icontains=search) |
                Q(student__email__icontains=search) |
                Q(student__phone__icontains=search)
            )

        pending_data = []

        for app in pending_qs:
            already_enrolled = BatchStudent.objects.filter(
                student_id=app.student_id,
                batch__course_id=app.course_id
            ).exists()

            if already_enrolled:
                continue

            pending_data.append({
                "application_id": app.id,
                "student": app.student_id,
                "student_name": app.student.full_name,
                "student_email": app.student.email,
                "student_phone": app.student.phone,
                "course_id": app.course_id,
                "course_name": app.course.name,
                "batch": None,
                "batch_name": None,
                "trainer_name": None,
                "enrolled_at": None,
                "enrollment_status": "PENDING_ASSIGNMENT",
            })

        if batch_id:
            pending_data = []

        return Response({
            "enrolled": enrolled_data,
            "pending_assignment": pending_data
        })



class AdminStudentDetailView(generics.RetrieveAPIView):
    serializer_class = BatchStudentSerializer

    def get_permissions(self):
        return _academy_role_permissions(self.request)

    def get_queryset(self):
        user = self.request.user

        if user.role == 'TRAINER':
            trainer_batches = Batch.objects.filter(trainer=user)
            return BatchStudent.objects.filter(
                batch__in=trainer_batches
            )

        return BatchStudent.objects.all()


class AdminStudentEnrollView(APIView):
    permission_classes = [IsManagerOrAdmin]

    @transaction.atomic
    def post(self, request, pk):
        try:
            student = CustomUser.objects.get(
                pk=pk,
                role='CUSTOMER'
            )
        except CustomUser.DoesNotExist:
            return Response(
                {"error": "Student not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        batch_id = request.data.get('batch_id')
        application_id = request.data.get('application_id')

        if not batch_id:
            return Response(
                {"error": "batch_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            batch = Batch.objects.select_for_update().select_related(
                'course',
                'trainer'
            ).get(
                pk=batch_id,
                is_active=True
            )
        except Batch.DoesNotExist:
            return Response(
                {"error": "Batch not found or inactive"},
                status=status.HTTP_404_NOT_FOUND
            )

        if batch.status != Batch.Status.ACTIVE:
            return Response(
                {"error": "Only active batches can accept enrollments"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if batch.trainer_id and (
            batch.trainer.role != "TRAINER" or
            not batch.trainer.is_active
        ):
            return Response(
                {"error": "Batch trainer must be an active trainer"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if application_id:
            try:
                application = AcademyApplication.objects.select_for_update().get(
                    pk=application_id,
                    student=student
                )
            except AcademyApplication.DoesNotExist:
                return Response(
                    {"error": "Application not found for this student"},
                    status=status.HTTP_404_NOT_FOUND
                )

            if application.status != AcademyApplication.Status.APPROVED:
                return Response(
                    {"error": "Only approved applications can be enrolled"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if application.course_id != batch.course_id:
                return Response(
                    {
                        "error": "Application course does not match the selected batch course"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            application = AcademyApplication.objects.select_for_update().filter(
                student=student,
                course=batch.course,
                status=AcademyApplication.Status.APPROVED
            ).order_by('-reviewed_at').first()

            if not application:
                return Response(
                    {
                        "error": (
                            "No approved application found for this student "
                            "for the selected batch's course. Approve an "
                            "application before enrolling."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        existing_course_enrollment = BatchStudent.objects.filter(
            student=student,
            batch__course=batch.course
        ).exists()

        if existing_course_enrollment:
            return Response(
                {"error": "Student is already enrolled in this course"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if BatchStudent.objects.filter(
            student=student,
            batch=batch
        ).exists():
            return Response(
                {"error": "Student already enrolled in this batch"},
                status=status.HTTP_400_BAD_REQUEST
            )

        current_students = BatchStudent.objects.filter(
            batch=batch
        ).count()

        if current_students >= batch.capacity:
            return Response(
                {"error": "Batch is full"},
                status=status.HTTP_400_BAD_REQUEST
            )

        enrollment = BatchStudent.objects.create(
            student=student,
            batch=batch
        )

        application.status = AcademyApplication.Status.APPROVED
        application.reviewed_at = application.reviewed_at or timezone.now()
        application.save(
            update_fields=['status', 'reviewed_at']
        )

        fee = _create_enrollment_fee(student, batch)

        serializer = BatchStudentSerializer(enrollment)

        return Response(
            {
                **serializer.data,
                "fee": AcademyFeeSerializer(fee).data,
            },
            status=status.HTTP_201_CREATED
        )


class AdminApplicationApproveView(APIView):
    permission_classes = [IsManagerOrAdmin]

    @transaction.atomic
    def post(self, request, pk):
        try:
            application = AcademyApplication.objects.select_for_update().select_related(
                'student',
                'course'
            ).get(pk=pk)
        except AcademyApplication.DoesNotExist:
            return Response(
                {"error": "Application not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if application.status != AcademyApplication.Status.PENDING:
            return Response(
                {
                    "error": f"Application is already {application.status.lower()}"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        batch_id = request.data.get("batch_id")

        if not batch_id:
            return Response(
                {"error": "batch_id is required for approval"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            batch = Batch.objects.select_for_update().select_related(
                'course',
                'trainer'
            ).get(pk=batch_id)
        except Batch.DoesNotExist:
            return Response(
                {"error": "Batch not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if batch.course_id != application.course_id:
            return Response(
                {
                    "error": "Selected batch does not belong to the application course"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not batch.is_active or batch.status != Batch.Status.ACTIVE:
            return Response(
                {"error": "Selected batch is not active"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if batch.trainer_id and (
            batch.trainer.role != "TRAINER" or
            not batch.trainer.is_active
        ):
            return Response(
                {"error": "Selected batch has an invalid or inactive trainer"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if BatchStudent.objects.filter(
            student=application.student,
            batch__course_id=application.course_id
        ).exists():
            return Response(
                {"error": "Student is already enrolled in this course"},
                status=status.HTTP_400_BAD_REQUEST
            )

        current_students = BatchStudent.objects.filter(
            batch=batch
        ).count()

        if current_students >= batch.capacity:
            return Response(
                {"error": "Selected batch is full"},
                status=status.HTTP_400_BAD_REQUEST
            )

        enrollment = BatchStudent.objects.create(
            student=application.student,
            batch=batch
        )

        application.status = AcademyApplication.Status.APPROVED
        application.reviewed_at = timezone.now()
        application.save(
            update_fields=['status', 'reviewed_at']
        )

        fee = _create_enrollment_fee(application.student, batch)

        return Response(
            {
                "message": "Application approved and student enrolled successfully",
                "application": AcademyApplicationSerializer(application).data,
                "enrollment": BatchStudentSerializer(enrollment).data,
                "fee": AcademyFeeSerializer(fee).data
            },
            status=status.HTTP_200_OK
        )


class AdminApplicationRejectView(APIView):
    permission_classes = [IsManagerOrAdmin]

    @transaction.atomic
    def post(self, request, pk):
        try:
            application = AcademyApplication.objects.select_for_update().get(
                pk=pk
            )
        except AcademyApplication.DoesNotExist:
            return Response(
                {"error": "Application not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if application.status != AcademyApplication.Status.PENDING:
            return Response(
                {
                    "error": f"Application is already {application.status.lower()}"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        application.status = AcademyApplication.Status.REJECTED
        application.reviewed_at = timezone.now()
        application.save(
            update_fields=['status', 'reviewed_at']
        )

        return Response(
            {
                "message": "Application rejected successfully",
                "application": AcademyApplicationSerializer(application).data
            },
            status=status.HTTP_200_OK
        )


class AdminStudentRemoveView(APIView):
    permission_classes = [IsManagerOrAdmin]

    def post(self, request, pk):
        try:
            enrollment = BatchStudent.objects.get(pk=pk)
        except BatchStudent.DoesNotExist:
            return Response(
                {"error": "Enrollment not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        batch_name = enrollment.batch.name
        student_name = enrollment.student.full_name

        enrollment.delete()

        return Response({
            "message": f"{student_name} removed from {batch_name}"
        })


class AdminStudentUpdateView(generics.UpdateAPIView):
    permission_classes = [IsManagerOrAdmin]
    serializer_class = BatchStudentSerializer
    queryset = BatchStudent.objects.all()


class PublicTrainerListView(generics.ListAPIView):
    """Public endpoint — returns active trainer profiles for the customer site."""
    authentication_classes = []
    permission_classes     = [AllowAny]

    def get_serializer_class(self):
        from .serializers import TrainerProfileSerializer
        return TrainerProfileSerializer

    def get_queryset(self):
        from .models import TrainerProfile
        return TrainerProfile.objects.filter(is_active=True).select_related("user")


class PublicTrainerDetailView(generics.RetrieveAPIView):
    """Public trainer profile for the customer site."""
    authentication_classes = []
    permission_classes     = [AllowAny]

    def get_serializer_class(self):
        from .serializers import TrainerProfileSerializer
        return TrainerProfileSerializer

    def get_queryset(self):
        from .models import TrainerProfile
        return TrainerProfile.objects.filter(is_active=True).select_related("user")


class AdminTrainerProfileView(APIView):
    """
    Admin: GET or PATCH the TrainerProfile for a trainer user.
    Creates the profile on first PATCH if it doesn't exist yet.
    Accepts multipart/form-data so photo can be uploaded.
    """
    permission_classes = [IsManagerOrAdmin]

    def get(self, request, pk):
        from .models import TrainerProfile
        from .serializers import TrainerProfileSerializer
        try:
            trainer_user = CustomUser.objects.get(pk=pk, role="TRAINER")
        except CustomUser.DoesNotExist:
            return Response({"error": "Trainer not found."}, status=status.HTTP_404_NOT_FOUND)

        profile, _ = TrainerProfile.objects.get_or_create(user=trainer_user)
        return Response(TrainerProfileSerializer(profile, context={"request": request}).data)

    def patch(self, request, pk):
        from .models import TrainerProfile
        from .serializers import TrainerProfileSerializer
        try:
            trainer_user = CustomUser.objects.get(pk=pk, role="TRAINER")
        except CustomUser.DoesNotExist:
            return Response({"error": "Trainer not found."}, status=status.HTTP_404_NOT_FOUND)

        profile, _ = TrainerProfile.objects.get_or_create(user=trainer_user)
        serializer = TrainerProfileSerializer(
            profile, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class AdminTrainerListView(generics.ListAPIView):
    serializer_class = UserAccountListSerializer
    permission_classes = [IsManagerOrAdmin]

    def get_queryset(self):
        queryset = CustomUser.objects.filter(
            role='TRAINER'
        ).order_by('-date_joined')

        search = self.request.query_params.get('search')
        is_active = self.request.query_params.get('is_active')

        if search:
            queryset = queryset.filter(
                Q(full_name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search)
            )

        if is_active is not None:
            queryset = queryset.filter(
                is_active=is_active.lower() == 'true'
            )

        return queryset


class AdminTrainerDetailView(generics.RetrieveAPIView):
    serializer_class = UserAccountListSerializer
    permission_classes = [IsManagerOrAdmin]

    def get_queryset(self):
        return CustomUser.objects.filter(role='TRAINER')


class AdminTrainerCreateView(generics.CreateAPIView):
    serializer_class = UserAccountCreateSerializer
    permission_classes = [IsManagerOrAdmin]

    def perform_create(self, serializer):
        serializer.save(role='TRAINER')


class AdminTrainerUpdateView(generics.UpdateAPIView):
    serializer_class = UserAccountListSerializer
    permission_classes = [IsManagerOrAdmin]

    def get_queryset(self):
        return CustomUser.objects.filter(role='TRAINER')


class AdminTrainerDeactivateView(APIView):
    permission_classes = [IsManagerOrAdmin]

    def post(self, request, pk):
        try:
            trainer = CustomUser.objects.get(
                pk=pk,
                role='TRAINER'
            )
        except CustomUser.DoesNotExist:
            return Response(
                {"error": "Trainer not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if trainer.is_active:
            active_batches = Batch.objects.filter(
                trainer=trainer,
                status=Batch.Status.ACTIVE,
                is_active=True
            ).exists()

            if active_batches:
                return Response(
                    {
                        "error": "Cannot deactivate a trainer assigned to active batches"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        trainer.is_active = not trainer.is_active
        trainer.save(update_fields=['is_active'])

        return Response({
            "id": trainer.id,
            "is_active": trainer.is_active,
            "message": (
                f"Trainer {'activated' if trainer.is_active else 'deactivated'}"
            )
        })


class AdminTrainerBatchesView(generics.ListAPIView):
    serializer_class = BatchSerializer
    permission_classes = [IsManagerOrAdmin]

    def get_queryset(self):
        return Batch.objects.filter(
            trainer_id=self.kwargs['pk'],
            is_active=True
        ).select_related(
            'course'
        ).order_by('-start_date')


class AdminBatchListCreateView(generics.ListCreateAPIView):
    serializer_class = BatchSerializer
    permission_classes = [IsManagerOrAdmin]

    def get_queryset(self):
        return Batch.objects.all().select_related(
            'course',
            'trainer'
        ).order_by('-start_date')

    def perform_create(self, serializer):
        trainer = serializer.validated_data.get("trainer")

        if trainer and (
            trainer.role != "TRAINER" or
            not trainer.is_active
        ):
            raise PermissionDenied(
                "Batch trainer must be an active trainer."
            )

        serializer.save()


class AdminBatchDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = BatchSerializer

    def get_permissions(self):
        if not self.request.user.is_authenticated:
            return [IsAuthenticated()]

        if self.request.method == 'GET':
            if self.request.user.role == 'TRAINER':
                return [IsTrainer()]

            return [IsManagerOrAdmin()]

        return [IsManagerOrAdmin()]

    def get_queryset(self):
        qs = Batch.objects.all().select_related(
            'course',
            'trainer'
        )

        if self.request.user.role == 'TRAINER':
            qs = qs.filter(trainer=self.request.user)

        return qs

    def perform_update(self, serializer):
        trainer = serializer.validated_data.get("trainer")

        if trainer and (
            trainer.role != "TRAINER" or
            not trainer.is_active
        ):
            raise PermissionDenied(
                "Batch trainer must be an active trainer."
            )

        serializer.save()


class AdminBatchCancelView(APIView):
    permission_classes = [IsManagerOrAdmin]

    def post(self, request, pk):
        try:
            batch = Batch.objects.get(pk=pk)
        except Batch.DoesNotExist:
            return Response(
                {"error": "Batch not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if batch.students.count() > 0:
            return Response(
                {"error": "Cannot cancel batch with enrolled students"},
                status=status.HTTP_400_BAD_REQUEST
            )

        batch.status = Batch.Status.CANCELLED
        batch.is_active = False
        batch.save(
            update_fields=["status", "is_active"]
        )

        return Response({
            "id": batch.id,
            "status": batch.status,
            "is_active": batch.is_active
        })


class AdminBatchCompleteView(APIView):
    permission_classes = [IsManagerOrAdmin]

    def post(self, request, pk):
        try:
            batch = Batch.objects.get(pk=pk)
        except Batch.DoesNotExist:
            return Response(
                {"error": "Batch not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        batch.status = Batch.Status.COMPLETED
        batch.is_active = False
        batch.save(
            update_fields=["status", "is_active"]
        )

        return Response({
            "id": batch.id,
            "status": batch.status,
            "is_active": batch.is_active
        })


class AdminBatchReactivateView(APIView):
    permission_classes = [IsManagerOrAdmin]

    def post(self, request, pk):
        try:
            batch = Batch.objects.select_related(
                'trainer'
            ).get(pk=pk)
        except Batch.DoesNotExist:
            return Response(
                {"error": "Batch not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if batch.status == Batch.Status.COMPLETED:
            return Response(
                {"error": "Completed batches cannot be reactivated"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if batch.trainer_id and not batch.trainer.is_active:
            return Response(
                {
                    "error": "Cannot reactivate a batch with an inactive trainer"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        batch.status = Batch.Status.ACTIVE
        batch.is_active = True
        batch.save(
            update_fields=["status", "is_active"]
        )

        return Response({
            "id": batch.id,
            "status": batch.status,
            "is_active": batch.is_active
        })


class AdminBatchStudentsView(generics.ListAPIView):
    serializer_class = BatchStudentSerializer

    def get_permissions(self):
        return _academy_role_permissions(self.request)

    def get_queryset(self):
        batch_id = self.kwargs['pk']

        qs = BatchStudent.objects.filter(
            batch_id=batch_id
        ).select_related(
            'student'
        ).order_by('-enrolled_at')

        if self.request.user.role == 'TRAINER':
            qs = qs.filter(
                batch__trainer=self.request.user
            )

        return qs


class TrainerBatchListView(generics.ListAPIView):
    serializer_class = BatchSerializer
    permission_classes = [IsTrainer]

    def get_queryset(self):
        return Batch.objects.filter(
            trainer=self.request.user,
            is_active=True
        ).select_related(
            'course'
        ).order_by('-start_date')


class AdminCourseListView(generics.ListAPIView):
    serializer_class = CourseSerializer

    def get_permissions(self):
        return _academy_role_permissions(self.request)

    def get_queryset(self):
        return Course.objects.all().order_by('-created_at')


class AdminSessionListView(generics.ListCreateAPIView):
    serializer_class = AcademySessionSerializer
    permission_classes = [TrainerWriteReadOnlyOthers]

    def get_queryset(self):
        qs = AcademySession.objects.filter(
            batch_id=self.kwargs['batch_id']
        ).select_related(
            'batch',
            'module',
            'trainer'
        ).order_by(
            '-date',
            '-start_time'
        )

        if self.request.user.role == 'TRAINER':
            qs = qs.filter(
                trainer=self.request.user
            )

        return qs

    def perform_create(self, serializer):
        batch = Batch.objects.get(
            pk=self.kwargs['batch_id']
        )

        user = self.request.user

        if user.role == 'TRAINER' and batch.trainer_id != user.id:
            raise PermissionDenied(
                "You are not assigned to this batch."
            )

        _validate_session_against_batch(
            batch,
            serializer.validated_data.get('module'),
            serializer.validated_data.get('date'),
        )

        serializer.save(
            batch=batch,
            trainer=user if user.role == 'TRAINER' else batch.trainer
        )


class AdminSessionAttendanceView(APIView):
    permission_classes = [TrainerWriteReadOnlyOthers]

    def get_session(self, pk):
        try:
            return AcademySession.objects.select_related(
                'batch'
            ).get(pk=pk)
        except AcademySession.DoesNotExist:
            return None

    def check_trainer_access(self, request, session):
        if (
            request.user.role == 'TRAINER' and
            session.trainer_id != request.user.id
        ):
            return False

        return True

    def get(self, request, pk):
        session = self.get_session(pk)

        if not session:
            return Response(
                {"error": "Session not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if not self.check_trainer_access(request, session):
            return Response(
                {"error": "You are not assigned to this session"},
                status=status.HTTP_403_FORBIDDEN
            )

        enrolled = BatchStudent.objects.filter(
            batch=session.batch
        ).select_related('student')

        existing = {
            a.student_id: a
            for a in Attendance.objects.filter(session=session)
        }

        data = [
            {
                "student": enrollment.student_id,
                "student_name": enrollment.student.full_name,
                "attendance_id": (
                    existing[enrollment.student_id].id
                    if enrollment.student_id in existing
                    else None
                ),
                "status": (
                    existing[enrollment.student_id].status
                    if enrollment.student_id in existing
                    else None
                ),
            }
            for enrollment in enrolled
        ]

        return Response(data)

    @transaction.atomic
    def post(self, request, pk):
        session = self.get_session(pk)

        if not session:
            return Response(
                {"error": "Session not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if not self.check_trainer_access(request, session):
            return Response(
                {"error": "You are not assigned to this session"},
                status=status.HTTP_403_FORBIDDEN
            )

        if session.date > timezone.now().date():
            return Response(
                {"error": "Cannot mark attendance for a future session."},
                status=status.HTTP_400_BAD_REQUEST
            )

        batch_closed = session.batch.status in (
            Batch.Status.COMPLETED,
            Batch.Status.CANCELLED,
        )

        cutoff_passed = timezone.now().date() > session.date + timedelta(days=7)

        if batch_closed or cutoff_passed:
            return Response(
                {
                    "error": (
                        "Attendance for this session can no longer be "
                        "edited. The 7-day edit window has closed or "
                        "the batch is no longer active."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        records = request.data.get('records', [])

        if not isinstance(records, list) or not records:
            return Response(
                {"error": "records list is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        errors = []
        validated = []

        for index, record in enumerate(records):
            if not isinstance(record, dict):
                errors.append({
                    "index": index,
                    "error": "Each attendance record must be an object"
                })
                continue

            student_id = record.get('student')
            att_status = record.get('status')

            if not student_id:
                errors.append({
                    "index": index,
                    "error": "student is required"
                })
                continue

            if att_status not in ('PRESENT', 'ABSENT'):
                errors.append({
                    "index": index,
                    "error": "status must be PRESENT or ABSENT"
                })
                continue

            if not BatchStudent.objects.filter(
                batch=session.batch,
                student_id=student_id
            ).exists():
                errors.append({
                    "index": index,
                    "student": student_id,
                    "error": "Student is not enrolled in this batch"
                })
                continue

            validated.append((student_id, att_status))

        if errors:
            return Response(
                {
                    "session": session.id,
                    "errors": errors,
                    "message": "No records were saved. Fix the errors and resubmit."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        results = []

        for student_id, att_status in validated:
            attendance, _ = Attendance.objects.update_or_create(
                session=session,
                student_id=student_id,
                defaults={"status": att_status}
            )

            results.append({
                "student": student_id,
                "status": attendance.status
            })

        return Response({
            "session": session.id,
            "marked": results
        })


class AdminSessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AcademySessionSerializer
    permission_classes = [TrainerWriteReadOnlyOthers]

    def get_queryset(self):
        qs = AcademySession.objects.select_related(
            'batch',
            'module',
            'trainer'
        )

        if self.request.user.role == 'TRAINER':
            qs = qs.filter(
                trainer=self.request.user
            )

        return qs

    def perform_update(self, serializer):
        session = self.get_object()
        _assert_trainer_owns_session(self.request.user, session)

        module = serializer.validated_data.get('module', session.module)
        session_date = serializer.validated_data.get('date', session.date)

        _validate_session_against_batch(session.batch, module, session_date)

        serializer.save()

    def perform_destroy(self, instance):
        _assert_trainer_owns_session(self.request.user, instance)
        instance.delete()


class AdminCourseDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = CourseSerializer
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get_permissions(self):
        return _academy_role_permissions(self.request)

    def get_queryset(self):
        return Course.objects.all()


class AdminCourseToggleStatusView(APIView):
    permission_classes = [IsManagerOrAdmin]

    def post(self, request, pk):
        try:
            course = Course.objects.get(pk=pk)
        except Course.DoesNotExist:
            return Response(
                {"error": "Course not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        course.is_active = not course.is_active
        course.save(
            update_fields=["is_active"]
        )

        action = (
            "activated"
            if course.is_active
            else "deactivated"
        )

        return Response({
            "id": course.id,
            "is_active": course.is_active,
            "message": f"Course {action} successfully"
        })


class AdminCourseModuleListCreateView(generics.ListCreateAPIView):
    serializer_class = CourseModuleSerializer

    def get_permissions(self):
        if not self.request.user.is_authenticated:
            return [IsAuthenticated()]

        if self.request.method == "GET":
            if self.request.user.role == "TRAINER":
                return [IsTrainer()]

            return [IsManagerOrAdmin()]

        return [IsManagerOrAdmin()]

    def get_queryset(self):
        course_id = self.kwargs["course_id"]

        return CourseModule.objects.filter(
            course_id=course_id
        ).select_related(
            "course"
        ).order_by("order")

    def perform_create(self, serializer):
        course_id = self.kwargs["course_id"]

        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            raise ValidationError(
                {"course": "Course not found"}
            )

        serializer.save(course=course)


class AdminCourseModuleDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CourseModuleSerializer
    permission_classes = [IsManagerOrAdmin]

    def get_queryset(self):
        return CourseModule.objects.filter(
            course_id=self.kwargs["course_id"]
        )


class AdminCourseCreateView(generics.CreateAPIView):
    serializer_class = CourseSerializer
    permission_classes = [IsManagerOrAdmin]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def perform_create(self, serializer):
        serializer.save()


class AdminCourseUpdateView(generics.UpdateAPIView):
    serializer_class = CourseSerializer
    permission_classes = [IsManagerOrAdmin]
    parser_classes = [JSONParser, FormParser, MultiPartParser]
    queryset = Course.objects.all()


class AdminAssessmentListCreateView(generics.ListCreateAPIView):
    serializer_class = AssessmentSerializer
    permission_classes = [TrainerWriteReadOnlyOthers]

    def get_queryset(self):
        queryset = Assessment.objects.all().select_related(
            'batch',
            'batch__course'
        ).order_by('-date')

        batch_id = self.request.query_params.get('batch_id')

        if self.request.user.role == 'TRAINER':
            queryset = queryset.filter(
                batch__trainer=self.request.user
            )

        if batch_id:
            queryset = queryset.filter(
                batch_id=batch_id
            )

        return queryset

    def perform_create(self, serializer):
        batch = serializer.validated_data['batch']
        _assert_trainer_owns_batch(self.request.user, batch)
        serializer.save()


class AdminAssessmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AssessmentSerializer
    permission_classes = [TrainerWriteReadOnlyOthers]

    def get_queryset(self):
        queryset = Assessment.objects.all().select_related(
            'batch',
            'batch__course'
        )

        if self.request.user.role == 'TRAINER':
            queryset = queryset.filter(
                batch__trainer=self.request.user
            )

        return queryset

    def perform_update(self, serializer):
        assessment = self.get_object()
        _assert_trainer_owns_batch(self.request.user, assessment.batch)
        serializer.save()

    def perform_destroy(self, instance):
        _assert_trainer_owns_batch(self.request.user, instance.batch)
        instance.delete()


class AdminAssessmentResultListCreateView(generics.ListCreateAPIView):
    serializer_class = AssessmentResultSerializer
    permission_classes = [TrainerWriteReadOnlyOthers]

    def get_queryset(self):
        assessment_id = self.kwargs.get('assessment_id')

        if self.request.user.role == 'TRAINER':
            try:
                assessment = Assessment.objects.get(
                    pk=assessment_id
                )
            except Assessment.DoesNotExist:
                return AssessmentResult.objects.none()

            if assessment.batch.trainer_id != self.request.user.id:
                raise PermissionDenied(
                    "You are not assigned to this batch."
                )

        return AssessmentResult.objects.filter(
            assessment_id=assessment_id
        ).select_related(
            'student',
            'assessment'
        ).order_by('-id')

    def perform_create(self, serializer):
        assessment_id = self.kwargs.get('assessment_id')

        try:
            assessment = Assessment.objects.select_related(
                'batch'
            ).get(pk=assessment_id)
        except Assessment.DoesNotExist:
            raise PermissionDenied(
                "Assessment not found."
            )

        _assert_trainer_owns_batch(self.request.user, assessment.batch)

        future_error = _future_exam_marks_error(
            assessment.date, "assessment marks"
        )
        if future_error:
            raise ValidationError(future_error)

        marks = serializer.validated_data['marks_obtained']
        passing_marks = (
            assessment.passing_marks
            if assessment.passing_marks is not None
            else assessment.max_marks * 0.4
        )

        student = serializer.validated_data['student']
        batch = assessment.batch

        today = timezone.now().date()

        total_sessions = AcademySession.objects.filter(
            batch=batch,
            date__lte=today
        ).count()

        attended_sessions = Attendance.objects.filter(
            session__batch=batch,
            session__date__lte=today,
            student=student,
            status='PRESENT'
        ).count()

        attendance_percentage = (
            attended_sessions / total_sessions * 100
            if total_sessions > 0
            else 0
        )

        if total_sessions > 0 and attendance_percentage < 40:
            is_passed = False
        else:
            is_passed = marks >= passing_marks

        serializer.save(
            assessment=assessment,
            is_passed=is_passed
        )


class AdminAssessmentResultUpdateView(generics.UpdateAPIView):
    serializer_class = AssessmentResultSerializer
    permission_classes = [TrainerWriteReadOnlyOthers]
    queryset = AssessmentResult.objects.all()

    def perform_update(self, serializer):
        instance = self.get_object()
        assessment = instance.assessment
        _assert_trainer_owns_batch(self.request.user, assessment.batch)

        future_error = _future_exam_marks_error(
            assessment.date, "assessment marks"
        )
        if future_error:
            raise ValidationError(future_error)

        marks = serializer.validated_data.get(
            'marks_obtained',
            instance.marks_obtained
        )

        passing_marks = (
            assessment.passing_marks
            if assessment.passing_marks is not None
            else assessment.max_marks * 0.4
        )

        student = instance.student
        batch = assessment.batch
        today = timezone.now().date()

        total_sessions = AcademySession.objects.filter(
            batch=batch,
            date__lte=today
        ).count()

        attended_sessions = Attendance.objects.filter(
            session__batch=batch,
            session__date__lte=today,
            student=student,
            status='PRESENT'
        ).count()

        attendance_percentage = (
            attended_sessions / total_sessions * 100
            if total_sessions > 0
            else 0
        )

        if total_sessions > 0 and attendance_percentage < 40:
            is_passed = False
        else:
            is_passed = marks >= passing_marks

        serializer.save(
            is_passed=is_passed
        )


class AdminPracticalSessionListCreateView(generics.ListCreateAPIView):
    serializer_class = PracticalSessionSerializer
    permission_classes = [TrainerWriteReadOnlyOthers]

    def get_queryset(self):
        queryset = PracticalSession.objects.all().select_related(
            'student',
            'trainer',
            'batch'
        ).prefetch_related(
            'evaluation__scores__criteria'
        ).order_by('-date')

        if self.request.user.role == 'TRAINER':
            queryset = queryset.filter(
                trainer=self.request.user
            )

        student_id = self.request.query_params.get('student_id')
        trainer_id = self.request.query_params.get('trainer_id')

        if student_id:
            queryset = queryset.filter(
                student_id=student_id
            )

        if trainer_id:
            queryset = queryset.filter(
                trainer_id=trainer_id
            )

        return queryset

    def perform_create(self, serializer):
        batch = serializer.validated_data.get("batch")

        if self.request.user.role == "TRAINER":
            if batch.trainer_id != self.request.user.id:
                raise PermissionDenied(
                    "You are not assigned to this batch."
                )

        serializer.save(
            trainer=(
                self.request.user
                if self.request.user.role == "TRAINER"
                else batch.trainer
            )
        )


class AdminPracticalSessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PracticalSessionSerializer
    permission_classes = [TrainerWriteReadOnlyOthers]

    def get_queryset(self):
        queryset = PracticalSession.objects.all().select_related(
            'student',
            'trainer',
            'batch'
        ).prefetch_related(
            'evaluation__scores__criteria'
        )

        if self.request.user.role == 'TRAINER':
            queryset = queryset.filter(
                trainer=self.request.user
            )

        return queryset

    def perform_update(self, serializer):
        instance = self.get_object()
        _assert_trainer_owns_session(self.request.user, instance)

        new_batch = serializer.validated_data.get("batch")
        new_student = serializer.validated_data.get("student")

        if new_batch and new_batch.id != instance.batch_id:
            raise PermissionDenied(
                "Batch cannot be changed after the session is created."
            )

        if new_student and new_student.id != instance.student_id:
            raise PermissionDenied(
                "Student cannot be changed after the session is created."
            )

        serializer.save()

    def perform_destroy(self, instance):
        _assert_trainer_owns_session(self.request.user, instance)
        instance.delete()


class AdminPracticalEvaluationCriteriaView(generics.ListAPIView):
    queryset = PracticalEvaluationCriteria.objects.all()
    serializer_class = PracticalEvaluationCriteriaSerializer

    def get_permissions(self):
        return _academy_role_permissions(self.request)


class AdminPracticalEvaluationCreateUpdateView(APIView):
    def get_permissions(self):
        return _academy_role_permissions(self.request)

    def post(self, request, session_id):
        try:
            session = PracticalSession.objects.select_related(
                'trainer'
            ).get(pk=session_id)
        except PracticalSession.DoesNotExist:
            return Response(
                {"error": "Session not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if (
            request.user.role == 'TRAINER' and
            session.trainer_id != request.user.id
        ):
            return Response(
                {"error": "You are not assigned to this session"},
                status=status.HTTP_403_FORBIDDEN
            )

        if hasattr(session, 'evaluation'):
            return Response(
                {"error": "Evaluation already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )

        future_error = _future_exam_marks_error(
            session.date, "practical marks"
        )
        if future_error:
            return Response(
                {"error": future_error},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = PracticalEvaluationCreateSerializer(
            data=request.data
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        scores_data = serializer.validated_data['scores']
        feedback = serializer.validated_data.get(
            'feedback',
            ''
        )

        total_marks = 0
        max_marks = 0

        evaluation = PracticalEvaluation.objects.create(
            session=session,
            feedback=feedback,
            max_marks=0,
            total_marks=0,
            is_passed=False
        )

        score_objects = []

        for score_item in scores_data:
            criteria_id = score_item['criteria_id']
            marks = score_item['marks']

            try:
                criteria = PracticalEvaluationCriteria.objects.get(
                    pk=criteria_id
                )
            except PracticalEvaluationCriteria.DoesNotExist:
                evaluation.delete()

                return Response(
                    {"error": f"Criteria {criteria_id} not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            if marks > criteria.max_marks:
                evaluation.delete()

                return Response(
                    {
                        "error": (
                            f"Marks for {criteria.name} "
                            f"cannot exceed {criteria.max_marks}"
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            score_objects.append(
                PracticalEvaluationScore(
                    evaluation=evaluation,
                    criteria=criteria,
                    marks_obtained=marks
                )
            )

            total_marks += marks
            max_marks += criteria.max_marks

        PracticalEvaluationScore.objects.bulk_create(
            score_objects
        )

        evaluation.total_marks = total_marks
        evaluation.max_marks = max_marks
        evaluation.is_passed = (
            total_marks >= max_marks * (PRACTICAL_PASS_PERCENTAGE / 100)
            if max_marks > 0
            else False
        )

        evaluation.save()

        result_serializer = PracticalEvaluationSerializer(
            evaluation
        )

        return Response(
            result_serializer.data,
            status=status.HTTP_201_CREATED
        )

    def patch(self, request, session_id):
        try:
            session = PracticalSession.objects.get(
                pk=session_id
            )
            evaluation = session.evaluation
        except (
            PracticalSession.DoesNotExist,
            PracticalEvaluation.DoesNotExist
        ):
            return Response(
                {"error": "Evaluation not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if (
            request.user.role == 'TRAINER' and
            session.trainer_id != request.user.id
        ):
            return Response(
                {"error": "You are not assigned to this session"},
                status=status.HTTP_403_FORBIDDEN
            )

        future_error = _future_exam_marks_error(
            session.date, "practical marks"
        )
        if future_error:
            return Response(
                {"error": future_error},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = PracticalEvaluationCreateSerializer(
            data=request.data
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        scores_data = serializer.validated_data['scores']
        feedback = serializer.validated_data.get(
            'feedback',
            evaluation.feedback
        )

        evaluation.scores.all().delete()

        total_marks = 0
        max_marks = 0

        score_objects = []

        for score_item in scores_data:
            criteria_id = score_item['criteria_id']
            marks = score_item['marks']

            try:
                criteria = PracticalEvaluationCriteria.objects.get(
                    pk=criteria_id
                )
            except PracticalEvaluationCriteria.DoesNotExist:
                return Response(
                    {"error": f"Criteria {criteria_id} not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            if marks > criteria.max_marks:
                return Response(
                    {
                        "error": (
                            f"Marks for {criteria.name} "
                            f"cannot exceed {criteria.max_marks}"
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            score_objects.append(
                PracticalEvaluationScore(
                    evaluation=evaluation,
                    criteria=criteria,
                    marks_obtained=marks
                )
            )

            total_marks += marks
            max_marks += criteria.max_marks

        PracticalEvaluationScore.objects.bulk_create(
            score_objects
        )

        evaluation.total_marks = total_marks
        evaluation.max_marks = max_marks
        evaluation.is_passed = (
            total_marks >= max_marks * (PRACTICAL_PASS_PERCENTAGE / 100)
            if max_marks > 0
            else False
        )
        evaluation.feedback = feedback
        evaluation.save()

        result_serializer = PracticalEvaluationSerializer(
            evaluation
        )

        return Response(result_serializer.data)


class AdminCertificateListView(generics.ListAPIView):
    serializer_class = CertificateSerializer

    def get_permissions(self):
        return _academy_role_permissions(self.request)

    def get_queryset(self):
        queryset = Certificate.objects.all().select_related(
            'student',
            'course',
            'batch'
        ).order_by('-issued_at')

        if self.request.user.role == 'TRAINER':
            queryset = queryset.filter(
                batch__trainer=self.request.user
            )

        status_filter = self.request.query_params.get('status')
        student_id = self.request.query_params.get('student_id')
        course_id = self.request.query_params.get('course_id')
        search = self.request.query_params.get('search')

        if status_filter:
            queryset = queryset.filter(
                status=status_filter
            )

        if student_id:
            queryset = queryset.filter(
                student_id=student_id
            )

        if course_id:
            queryset = queryset.filter(
                course_id=course_id
            )

        if search:
            queryset = queryset.filter(
                Q(student__full_name__icontains=search) |
                Q(certificate_number__icontains=search)
            )

        return queryset


class AdminCertificateDetailView(generics.RetrieveAPIView):
    serializer_class = CertificateSerializer
    permission_classes = [IsManagerOrAdmin]
    queryset = Certificate.objects.all().select_related(
        'student',
        'course',
        'batch'
    )


class AdminCertificateIssueView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            certificate = Certificate.objects.get(pk=pk)
        except Certificate.DoesNotExist:
            return Response(
                {"error": "Certificate not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if certificate.status != Certificate.Status.DRAFT:
            return Response(
                {
                    "error": (
                        f"Only draft certificates can be issued. "
                        f"Current status: {certificate.status}"
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        certificate.status = Certificate.Status.ISSUED
        certificate.issued_at = timezone.now()
        certificate.save(
            update_fields=['status', 'issued_at']
        )

        serializer = CertificateSerializer(
            certificate
        )

        return Response(serializer.data)


class AdminCertificateVerifyView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            certificate = Certificate.objects.get(pk=pk)
        except Certificate.DoesNotExist:
            return Response(
                {"error": "Certificate not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if certificate.status != Certificate.Status.ISSUED:
            return Response(
                {
                    "error": (
                        "Certificate must be issued "
                        "before verification"
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        certificate.status = Certificate.Status.VERIFIED
        certificate.is_verified = True

        certificate.save(
            update_fields=['status', 'is_verified']
        )

        serializer = CertificateSerializer(
            certificate
        )

        return Response(serializer.data)


class AdminCertificateRevokeView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            certificate = Certificate.objects.get(pk=pk)
        except Certificate.DoesNotExist:
            return Response(
                {"error": "Certificate not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if certificate.status not in (
            Certificate.Status.ISSUED,
            Certificate.Status.VERIFIED,
        ):
            return Response(
                {
                    "error": (
                        "Only issued or verified certificates "
                        "can be revoked."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        certificate.status = Certificate.Status.REVOKED
        certificate.is_verified = False

        certificate.save(
            update_fields=['status', 'is_verified']
        )

        serializer = CertificateSerializer(
            certificate
        )

        return Response(serializer.data)


class AdminCertificateAutoGenerateView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, batch_id):
        try:
            batch = Batch.objects.get(pk=batch_id)
        except Batch.DoesNotExist:
            return Response(
                {"error": "Batch not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if batch.status != Batch.Status.COMPLETED:
            return Response(
                {
                    "error": (
                        "Batch must be completed "
                        "to generate certificates"
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        today = timezone.now().date()

        students = BatchStudent.objects.filter(
            batch=batch
        ).select_related('student')

        generated = []
        skipped = []

        for enrollment in students:
            student = enrollment.student

            if Certificate.objects.filter(
                student=student,
                batch=batch
            ).exists():
                skipped.append({
                    "student": student.full_name,
                    "reason": "Certificate already exists"
                })
                continue

            assessments = Assessment.objects.filter(
                batch=batch
            )

            if not assessments.exists():
                skipped.append({
                    "student": student.full_name,
                    "reason": "No assessments found for this batch"
                })
                continue

            results = AssessmentResult.objects.filter(
                assessment__in=assessments,
                student=student
            )

            all_assessments_passed = True

            for assessment in assessments:
                result = results.filter(
                    assessment=assessment
                ).first()

                if not result or not result.is_passed:
                    all_assessments_passed = False
                    break

            if not all_assessments_passed:
                skipped.append({
                    "student": student.full_name,
                    "reason": "Not all assessments passed"
                })
                continue

            practical_sessions = PracticalSession.objects.filter(
                batch=batch,
                student=student
            ).select_related('evaluation')

            if practical_sessions.exists():
                all_practicals_passed = True

                for session in practical_sessions:
                    evaluation = getattr(session, 'evaluation', None)

                    if not evaluation or not evaluation.is_passed:
                        all_practicals_passed = False
                        break

                if not all_practicals_passed:
                    skipped.append({
                        "student": student.full_name,
                        "reason": "Not all practical sessions passed"
                    })
                    continue

            total_sessions = AcademySession.objects.filter(
                batch=batch,
                date__lte=today
            ).count()

            attended_sessions = Attendance.objects.filter(
                session__batch=batch,
                session__date__lte=today,
                student=student,
                status='PRESENT'
            ).count()

            attendance_percentage = (
                attended_sessions / total_sessions * 100
                if total_sessions > 0
                else 0
            )

            if attendance_percentage < 40:
                skipped.append({
                    "student": student.full_name,
                    "reason": (
                        f"Attendance "
                        f"{attendance_percentage:.1f}% < 40%"
                    )
                })
                continue

            cert_number = (
                f"SLEITH-{batch.course.id}-"
                f"{batch.id}-{student.id}-"
                f"{uuid.uuid4().hex[:8].upper()}"
            )

            certificate = Certificate.objects.create(
                student=student,
                course=batch.course,
                batch=batch,
                certificate_number=cert_number,
                status=Certificate.Status.DRAFT
            )

            generated.append({
                "student": student.full_name,
                "certificate_number": cert_number
            })

        return Response({
            "batch": batch.name,
            "generated": generated,
            "skipped": skipped,
            "total_generated": len(generated),
            "total_skipped": len(skipped)
        })


class AdminCertificateRestoreView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            certificate = Certificate.objects.get(pk=pk)
        except Certificate.DoesNotExist:
            return Response(
                {"error": "Certificate not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if certificate.status != Certificate.Status.REVOKED:
            return Response(
                {
                    "error": (
                        "Only revoked certificates "
                        "can be restored"
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        certificate.status = Certificate.Status.DRAFT
        certificate.is_verified = False

        certificate.save(
            update_fields=['status', 'is_verified']
        )

        serializer = CertificateSerializer(
            certificate
        )

        return Response(serializer.data)


class AdminCertificateCreateView(generics.CreateAPIView):
    serializer_class = CertificateSerializer
    permission_classes = [IsAdmin]

    def perform_create(self, serializer):
        course = serializer.validated_data.get('course')
        student = serializer.validated_data.get('student')

        cert_number = (
            f"SLEITH-{course.id}-"
            f"{student.id}-"
            f"{uuid.uuid4().hex[:8].upper()}"
        )

        serializer.save(
            certificate_number=cert_number,
            status=Certificate.Status.DRAFT,
        )


class AdminCertificateUpdateView(generics.UpdateAPIView):
    serializer_class = CertificateSerializer
    permission_classes = [IsAdmin]
    queryset = Certificate.objects.all()

    def perform_update(self, serializer):
        instance = self.get_object()

        if instance.status != Certificate.Status.DRAFT:
            raise PermissionDenied(
                "Only draft certificates can be edited. Issued, "
                "verified or revoked certificates cannot be modified."
            )

        serializer.save()


class AdminCertificateDeleteView(APIView):
    permission_classes = [IsAdmin]

    def delete(self, request, pk):
        try:
            certificate = Certificate.objects.get(
                pk=pk
            )
        except Certificate.DoesNotExist:
            return Response(
                {"error": "Certificate not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        certificate.delete()

        return Response(
            {"message": "Certificate deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )


class StudentBatchAttendanceView(APIView):
    def get_permissions(self):
        return _academy_role_permissions(self.request)

    def get(self, request, batch_id, student_id):
        try:
            batch = Batch.objects.get(
                pk=batch_id
            )
        except Batch.DoesNotExist:
            return Response(
                {"error": "Batch not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if (
            request.user.role == 'TRAINER' and
            batch.trainer_id != request.user.id
        ):
            return Response(
                {
                    "error": (
                        "You are not assigned "
                        "to this batch"
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        sessions = AcademySession.objects.filter(
            batch=batch
        ).order_by(
            'date',
            'start_time'
        )

        attendance_map = {
            a.session_id: a.status
            for a in Attendance.objects.filter(
                session__batch=batch,
                student_id=student_id
            )
        }

        data = [
            {
                "session_id": s.id,
                "title": s.title,
                "date": s.date,
                "status": attendance_map.get(s.id)
            }
            for s in sessions
        ]

        total = sessions.count()

        present = sum(
            1
            for s in sessions
            if attendance_map.get(s.id) == 'PRESENT'
        )

        percentage = (
            round((present / total) * 100, 1)
            if total
            else None
        )

        return Response({
            "sessions": data,
            "attendance_percentage": percentage
        })


class StudentBatchAssessmentsView(APIView):
    def get_permissions(self):
        return _academy_role_permissions(self.request)

    def get(self, request, batch_id, student_id):
        try:
            batch = Batch.objects.get(
                pk=batch_id
            )
        except Batch.DoesNotExist:
            return Response(
                {"error": "Batch not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if (
            request.user.role == 'TRAINER' and
            batch.trainer_id != request.user.id
        ):
            return Response(
                {
                    "error": (
                        "You are not assigned "
                        "to this batch"
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        assessments = Assessment.objects.filter(
            batch=batch
        ).order_by('date')

        results = {
            r.assessment_id: r
            for r in AssessmentResult.objects.filter(
                assessment__batch=batch,
                student_id=student_id
            )
        }

        data = [
            {
                "assessment_id": a.id,
                "title": a.title,
                "assessment_type": a.assessment_type,
                "max_marks": a.max_marks,
                "date": a.date,
                "marks_obtained": (
                    results[a.id].marks_obtained
                    if a.id in results
                    else None
                ),
                "is_passed": (
                    results[a.id].is_passed
                    if a.id in results
                    else None
                ),
            }
            for a in assessments
        ]

        return Response(data)


class AdminAcademyFeeListView(generics.ListCreateAPIView):
    serializer_class = AdminAcademyFeeSerializer
    permission_classes = [IsAdmin]

    def list(self, request, *args, **kwargs):
        student_id = request.query_params.get("student_id")
        if student_id:
            enrollments = BatchStudent.objects.filter(
                student_id=student_id
            ).select_related("student", "batch", "batch__course")
            for enrollment in enrollments:
                _create_enrollment_fee(enrollment.student, enrollment.batch)
        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        qs = AcademyFee.objects.all().select_related(
            'student',
            'batch'
        ).order_by('-due_date')

        student_id = self.request.query_params.get(
            'student_id'
        )

        batch_id = self.request.query_params.get(
            'batch_id'
        )

        status_filter = self.request.query_params.get(
            'status'
        )

        if student_id:
            qs = qs.filter(
                student_id=student_id
            )

        if batch_id:
            qs = qs.filter(
                batch_id=batch_id
            )

        if status_filter:
            qs = qs.filter(
                status=status_filter
            )

        return qs


class AdminAcademyFeeUpdateView(generics.UpdateAPIView):
    serializer_class = AdminAcademyFeeSerializer
    permission_classes = [IsAdmin]
    queryset = AcademyFee.objects.all()


class AdminAcademyFeeMarkPaidView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            fee = AcademyFee.objects.get(
                pk=pk
            )
        except AcademyFee.DoesNotExist:
            return Response(
                {"error": "Fee record not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if fee.status == AcademyFee.Status.PAID:
            return Response(
                {"error": "Fee is already marked as paid."},
                status=status.HTTP_400_BAD_REQUEST
            )

        fee.status = AcademyFee.Status.PAID
        fee.paid_date = timezone.now().date()

        fee.save(
            update_fields=[
                'status',
                'paid_date'
            ]
        )

        serializer = AdminAcademyFeeSerializer(
            fee
        )

        return Response(serializer.data)

class AcademyFeeDeleteAPIView(generics.DestroyAPIView):
    queryset = AcademyFee.objects.all()
    serializer_class = AcademyFeeSerializer
    permission_classes = [IsAdmin]