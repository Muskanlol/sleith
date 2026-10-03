from django.utils import timezone
from rest_framework import serializers

from .models import (
    Course,
    CourseModule,
    TrainerProfile,
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
    PracticalEvaluationCriteria,
    PracticalEvaluationScore,
    Certificate,
)


class TrainerProfileSerializer(serializers.ModelSerializer):
    full_name      = serializers.CharField(source="user.full_name", read_only=True)
    email          = serializers.CharField(source="user.email",     read_only=True)
    phone          = serializers.CharField(source="user.phone",     read_only=True)
    photo_url      = serializers.SerializerMethodField()

    class Meta:
        model  = TrainerProfile
        fields = [
            "id", "full_name", "email", "phone",
            "photo", "photo_url", "bio", "specialization", "is_active",
        ]

    def get_photo_url(self, obj):
        if not obj.photo:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(obj.photo.url) if request else obj.photo.url


class CourseSerializer(serializers.ModelSerializer):
    image_before_url = serializers.SerializerMethodField()
    image_after_url = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id",
            "name",
            "description",
            "duration_months",
            "fee",
            "is_active",
            "created_at",
            "image_before",
            "image_after",
            "image_before_url",
            "image_after_url",
        ]
        read_only_fields = ["id", "created_at", "image_before_url", "image_after_url"]
        extra_kwargs = {
            "image_before": {"required": False, "allow_null": True, "write_only": True},
            "image_after":  {"required": False, "allow_null": True, "write_only": True},
        }

    def _abs(self, image):
        if not image:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(image.url) if request else image.url

    def get_image_before_url(self, obj):
        return self._abs(obj.image_before)

    def get_image_after_url(self, obj):
        return self._abs(obj.image_after)

    def validate_duration_months(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Duration must be greater than 0."
            )
        return value

    def validate_fee(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Fee cannot be negative."
            )
        return value


class CourseModuleSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(
        source="course.name",
        read_only=True,
    )

    class Meta:
        model = CourseModule
        fields = [
            "id",
            "course",
            "course_name",
            "title",
            "description",
            "order",
        ]
        read_only_fields = [
            "id",
            "course",
            "course_name",
        ]


class AcademyApplicationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source="student.full_name",
        read_only=True,
    )
    student_email = serializers.CharField(
        source="student.email",
        read_only=True,
    )
    student_phone = serializers.CharField(
        source="student.phone",
        read_only=True,
    )
    course_name = serializers.CharField(
        source="course.name",
        read_only=True,
    )

    class Meta:
        model = AcademyApplication
        fields = [
            "id",
            "student",
            "student_name",
            "student_email",
            "student_phone",
            "course",
            "course_name",
            "notes",
            "admin_note",
            "customer_response",
            "customer_response_at",
            "status",
            "applied_at",
            "reviewed_at",
        ]
        read_only_fields = [
            "id",
            "student",
            "student_name",
            "student_email",
            "student_phone",
            "course_name",
            "status",
            "customer_response",
            "customer_response_at",
            "applied_at",
            "reviewed_at",
        ]


class BatchStudentSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(
        source="student.id",
        read_only=True,
    )
    student_name = serializers.CharField(
        source="student.full_name",
        read_only=True,
    )
    student_email = serializers.CharField(
        source="student.email",
        read_only=True,
    )
    student_phone = serializers.CharField(
        source="student.phone",
        read_only=True,
    )
    batch_name = serializers.CharField(
        source="batch.name",
        read_only=True,
    )
    course_id = serializers.IntegerField(
        source="batch.course_id",
        read_only=True,
    )
    course_name = serializers.CharField(
        source="batch.course.name",
        read_only=True,
    )
    trainer_name = serializers.CharField(
        source="batch.trainer.full_name",
        read_only=True,
        default=None,
    )
    batch_start_date = serializers.DateField(
        source="batch.start_date",
        read_only=True,
    )
    batch_end_date = serializers.DateField(
        source="batch.end_date",
        read_only=True,
    )
    batch_status = serializers.CharField(
        source="batch.status",
        read_only=True,
    )
    attendance_percentage = serializers.SerializerMethodField()

    class Meta:
        model = BatchStudent
        fields = [
            "id",
            "student_id",
            "batch",
            "batch_name",
            "batch_start_date",
            "batch_end_date",
            "batch_status",
            "course_id",
            "course_name",
            "student",
            "student_name",
            "student_email",
            "student_phone",
            "trainer_name",
            "enrolled_at",
            "attendance_percentage",
        ]
        read_only_fields = [
            "id",
            "student_id",
            "batch_name",
            "batch_start_date",
            "batch_end_date",
            "batch_status",
            "course_id",
            "course_name",
            "student_name",
            "student_email",
            "student_phone",
            "trainer_name",
            "enrolled_at",
            "attendance_percentage",
        ]

    def get_attendance_percentage(self, obj):   
        today = timezone.now().date()
        total = Attendance.objects.filter(
            session__batch=obj.batch,
            session__date__lte=today,
        ).values("session_id").distinct().count()

        if total == 0:
            return None

        present = Attendance.objects.filter(
            session__batch=obj.batch,
            session__date__lte=today,
            student=obj.student,
            status="PRESENT",
        ).count()

        return round((present / total) * 100, 1)


class AcademyFeeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source="student.full_name",
        read_only=True,
    )
    batch_name = serializers.CharField(
        source="batch.name",
        read_only=True,
    )

    class Meta:
        model = AcademyFee
        fields = [
            "id",
            "student",
            "student_name",
            "batch",
            "batch_name",
            "amount",
            "due_date",
            "paid_date",
            "status",
        ]
        read_only_fields = [
            "id",
            "student_name",
            "batch_name",
            "paid_date",
            "status",
        ]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Fee amount must be greater than 0."
            )
        return value

    def validate(self, attrs):
        student = attrs.get(
            "student",
            getattr(self.instance, "student", None),
        )
        batch = attrs.get(
            "batch",
            getattr(self.instance, "batch", None),
        )

        if student and batch:
            if not BatchStudent.objects.filter(
                student=student,
                batch=batch,
            ).exists():
                raise serializers.ValidationError({
                    "batch": "Student is not enrolled in the selected batch."
                })

            if self.instance is None:
                if AcademyFee.objects.filter(
                    student=student,
                    batch=batch,
                ).exists():
                    raise serializers.ValidationError({
                        "batch": "A fee record already exists for this student and batch."
                    })

        return attrs


class AcademySessionSerializer(serializers.ModelSerializer):
    batch_name = serializers.CharField(
        source="batch.name",
        read_only=True,
    )
    module_name = serializers.CharField(
        source="module.title",
        read_only=True,
    )
    trainer_name = serializers.CharField(
        source="trainer.full_name",
        read_only=True,
        default=None,
    )

    class Meta:
        model = AcademySession
        fields = [
            "id",
            "batch",
            "batch_name",
            "module",
            "module_name",
            "title",
            "date",
            "start_time",
            "end_time",
            "trainer",
            "trainer_name",
        ]
        read_only_fields = [
            "id",
            "batch",
            "batch_name",
            "trainer",
            "trainer_name",
            "module_name",
        ]

    def validate(self, attrs):
        start_time = attrs.get(
            "start_time",
            getattr(self.instance, "start_time", None),
        )
        end_time = attrs.get(
            "end_time",
            getattr(self.instance, "end_time", None),
        )

        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError({
                "end_time": "End time must be after start time."
            })

        return attrs


class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source="student.full_name",
        read_only=True,
    )
    session_title = serializers.CharField(
        source="session.title",
        read_only=True,
    )
    session_date = serializers.DateField(
        source="session.date",
        read_only=True,
    )
    session_start_time = serializers.TimeField(
        source="session.start_time",
        read_only=True,
    )
    session_end_time = serializers.TimeField(
        source="session.end_time",
        read_only=True,
    )
    batch_name = serializers.CharField(
        source="session.batch.name",
        read_only=True,
    )
    course_name = serializers.CharField(
        source="session.batch.course.name",
        read_only=True,
    )

    class Meta:
        model = Attendance
        fields = [
            "id",
            "session",
            "session_title",
            "session_date",
            "session_start_time",
            "session_end_time",
            "batch_name",
            "course_name",
            "student",
            "student_name",
            "status",
        ]
        read_only_fields = [
            "id",
            "session_title",
            "session_date",
            "session_start_time",
            "session_end_time",
            "batch_name",
            "course_name",
            "student_name",
        ]

    def validate_status(self, value):
        valid_statuses = {
            choice[0]
            for choice in Attendance.Status.choices
        }

        if value not in valid_statuses:
            raise serializers.ValidationError(
                "Invalid attendance status."
            )

        return value

    def validate(self, attrs):
        session = attrs.get(
            "session",
            getattr(self.instance, "session", None),
        )
        student = attrs.get(
            "student",
            getattr(self.instance, "student", None),
        )

        if session and student:
            if not BatchStudent.objects.filter(
                batch=session.batch,
                student=student,
            ).exists():
                raise serializers.ValidationError({
                    "student": "Student is not enrolled in this batch."
                })

        return attrs


class AssessmentSerializer(serializers.ModelSerializer):
    batch_name = serializers.CharField(
        source="batch.name",
        read_only=True,
    )

    class Meta:
        model = Assessment
        fields = [
            "id",
            "batch",
            "batch_name",
            "title",
            "assessment_type",
            "max_marks",
            "passing_marks",
            "date",
        ]
        read_only_fields = [
            "id",
            "batch_name",
        ]

    def validate_max_marks(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Maximum marks must be greater than 0."
            )
        return value

    def validate_passing_marks(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Passing marks cannot be negative."
            )
        return value

    def validate(self, attrs):
        max_marks = attrs.get(
            "max_marks",
            getattr(self.instance, "max_marks", None),
        )
        passing_marks = attrs.get(
            "passing_marks",
            getattr(self.instance, "passing_marks", None),
        )

        if (
            max_marks is not None
            and passing_marks is not None
            and passing_marks > max_marks
        ):
            raise serializers.ValidationError({
                "passing_marks": "Passing marks cannot exceed maximum marks."
            })

        return attrs


class AssessmentResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source="student.full_name",
        read_only=True,
    )
    assessment_title = serializers.CharField(
        source="assessment.title",
        read_only=True,
    )
    assessment_type = serializers.CharField(
        source="assessment.assessment_type",
        read_only=True,
    )
    max_marks = serializers.IntegerField(
        source="assessment.max_marks",
        read_only=True,
    )
    passing_marks = serializers.IntegerField(
        source="assessment.passing_marks",
        read_only=True,
    )
    assessment_date = serializers.DateField(
        source="assessment.date",
        read_only=True,
    )
    batch_name = serializers.CharField(
        source="assessment.batch.name",
        read_only=True,
    )
    course_name = serializers.CharField(
        source="assessment.batch.course.name",
        read_only=True,
    )

    class Meta:
        model = AssessmentResult
        fields = [
            "id",
            "assessment",
            "assessment_title",
            "assessment_type",
            "max_marks",
            "passing_marks",
            "assessment_date",
            "batch_name",
            "course_name",
            "student",
            "student_name",
            "marks_obtained",
            "is_passed",
        ]
        read_only_fields = [
            "id",
            "assessment_title",
            "assessment_type",
            "max_marks",
            "passing_marks",
            "assessment_date",
            "batch_name",
            "course_name",
            "student_name",
            "is_passed",
        ]

    def validate(self, attrs):
        assessment = attrs.get(
            "assessment",
            getattr(self.instance, "assessment", None),
        )
        student = attrs.get(
            "student",
            getattr(self.instance, "student", None),
        )
        marks = attrs.get(
            "marks_obtained",
            getattr(self.instance, "marks_obtained", None),
        )

        if assessment and student:
            if not BatchStudent.objects.filter(
                batch=assessment.batch,
                student=student,
            ).exists():
                raise serializers.ValidationError({
                    "student": "Student is not enrolled in this assessment batch."
                })

        if assessment and assessment.date and assessment.date > timezone.now().date():
            raise serializers.ValidationError(
                f"Cannot enter assessment marks before {assessment.date}. "
                "Marks can be saved on that date or after."
            )

        if (
            assessment
            and marks is not None
            and (
                marks < 0
                or marks > assessment.max_marks
            )
        ):
            raise serializers.ValidationError({
                "marks_obtained": (
                    f"Marks must be between 0 and {assessment.max_marks}."
                )
            })

        return attrs


class PracticalEvaluationCriteriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PracticalEvaluationCriteria
        fields = [
            "id",
            "name",
            "max_marks",
            "description",
        ]

    def validate_max_marks(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Maximum marks must be greater than 0."
            )
        return value


class PracticalEvaluationScoreSerializer(serializers.ModelSerializer):
    criteria_name = serializers.CharField(
        source="criteria.name",
        read_only=True,
    )
    max_marks = serializers.IntegerField(
        source="criteria.max_marks",
        read_only=True,
    )

    class Meta:
        model = PracticalEvaluationScore
        fields = [
            "id",
            "criteria",
            "criteria_name",
            "marks_obtained",
            "max_marks",
        ]
        read_only_fields = [
            "id",
            "criteria_name",
            "max_marks",
        ]

    def validate_marks_obtained(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Marks cannot be negative."
            )
        return value

    def validate(self, attrs):
        criteria = attrs.get(
            "criteria",
            getattr(self.instance, "criteria", None),
        )
        marks = attrs.get(
            "marks_obtained",
            getattr(self.instance, "marks_obtained", None),
        )

        if (
            criteria
            and marks is not None
            and marks > criteria.max_marks
        ):
            raise serializers.ValidationError({
                "marks_obtained": (
                    f"Marks cannot exceed {criteria.max_marks}."
                )
            })

        return attrs


class PracticalEvaluationSerializer(serializers.ModelSerializer):
    session_student = serializers.CharField(
        source="session.student.full_name",
        read_only=True,
    )
    session_title = serializers.CharField(
        source="session.title",
        read_only=True,
    )
    trainer_name = serializers.CharField(
        source="session.trainer.full_name",
        read_only=True,
    )
    scores = PracticalEvaluationScoreSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = PracticalEvaluation
        fields = [
            "id",
            "session",
            "session_student",
            "session_title",
            "trainer_name",
            "total_marks",
            "max_marks",
            "is_passed",
            "feedback",
            "evaluated_at",
            "scores",
        ]
        read_only_fields = [
            "id",
            "session_student",
            "session_title",
            "trainer_name",
            "evaluated_at",
            "is_passed",
            "total_marks",
            "max_marks",
        ]


class PracticalSessionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source="student.full_name",
        read_only=True,
    )
    trainer_name = serializers.CharField(
        source="trainer.full_name",
        read_only=True,
    )
    batch_name = serializers.CharField(
        source="batch.name",
        read_only=True,
    )
    course_name = serializers.CharField(
        source="batch.course.name",
        read_only=True,
        default=None,
    )
    batch = serializers.PrimaryKeyRelatedField(
        queryset=Batch.objects.all(),
        required=True,
    )
    evaluation = serializers.SerializerMethodField()

    class Meta:
        model = PracticalSession
        fields = [
            "id",
            "student",
            "student_name",
            "batch",
            "batch_name",
            "course_name",
            "trainer",
            "trainer_name",
            "title",
            "date",
            "notes",
            "evaluation",
        ]
        read_only_fields = [
            "id",
            "student_name",
            "batch_name",
            "course_name",
            "trainer",
            "trainer_name",
            "evaluation",
        ]

    def validate(self, attrs):
        batch = attrs.get(
            "batch",
            getattr(self.instance, "batch", None),
        )
        student = attrs.get(
            "student",
            getattr(self.instance, "student", None),
        )

        if batch and student:
            if not BatchStudent.objects.filter(
                batch=batch,
                student=student,
            ).exists():
                raise serializers.ValidationError({
                    "student": "Student is not enrolled in this batch."
                })

        return attrs

    def get_evaluation(self, obj):
        try:
            evaluation = obj.evaluation
            if evaluation and evaluation.id:
                return PracticalEvaluationSerializer(
                    evaluation
                ).data
            return None
        except (
            PracticalEvaluation.DoesNotExist,
            AttributeError,
        ):
            return None


class PracticalEvaluationCreateSerializer(serializers.Serializer):
    scores = serializers.ListField(
        child=serializers.DictField(
            child=serializers.IntegerField(),
            allow_empty=False,
        ),
        allow_empty=False,
    )
    feedback = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    def validate_scores(self, value):
        criteria_ids = set()

        for score in value:
            if "criteria_id" not in score or "marks" not in score:
                raise serializers.ValidationError(
                    "Each score must have criteria_id and marks."
                )

            criteria_id = score["criteria_id"]

            if criteria_id in criteria_ids:
                raise serializers.ValidationError(
                    "Duplicate criteria are not allowed."
                )

            criteria_ids.add(criteria_id)

            if score["marks"] < 0:
                raise serializers.ValidationError(
                    "Marks cannot be negative."
                )

        return value


class CertificateSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source="student.full_name",
        read_only=True,
    )
    course_name = serializers.CharField(
        source="course.name",
        read_only=True,
    )
    batch_name = serializers.CharField(
        source="batch.name",
        read_only=True,
    )

    class Meta:
        model = Certificate
        fields = [
            "id",
            "student",
            "student_name",
            "course",
            "course_name",
            "batch",
            "batch_name",
            "certificate_number",
            "status",
            "issued_at",
            "is_verified",
        ]
        read_only_fields = [
            "id",
            "certificate_number",
            "issued_at",
            "batch_name",
            "student_name",
            "course_name",
        ]

    def validate(self, attrs):
        student = attrs.get("student", getattr(self.instance, "student", None))
        course = attrs.get("course", getattr(self.instance, "course", None))
        batch = attrs.get("batch", getattr(self.instance, "batch", None))

        if batch:
            if course and batch.course_id != course.id:
                raise serializers.ValidationError({
                    "batch": "Selected batch does not belong to the selected course."
                })

            if student and not BatchStudent.objects.filter(batch=batch, student=student).exists():
                raise serializers.ValidationError({
                    "student": "Student is not enrolled in the selected batch."
                })

            total_sessions = Attendance.objects.filter(
                session__batch=batch,
                session__date__lte=timezone.now().date()
            ).values("session_id").distinct().count()

            if total_sessions > 0:
                present_count = Attendance.objects.filter(
                    session__batch=batch,
                    session__date__lte=timezone.now().date(),
                    student=student,
                    status="PRESENT"
                ).count()
                percentage = round((present_count / total_sessions) * 100, 1)

                if percentage < 75: 
                    raise serializers.ValidationError({
                        "attendance": f"Certificate cannot be issued. Attendance is {percentage}%, below required threshold."
                    })

            practical_passed = PracticalEvaluation.objects.filter(
                session__batch=batch,
                session__student=student,
                is_passed=True
            ).exists()

            if not practical_passed:
                raise serializers.ValidationError({
                    "practical": "Certificate cannot be issued. Student has not passed practical evaluation."
                })

            unpaid_fees = AcademyFee.objects.filter(
                student=student,
                batch=batch,
                status=AcademyFee.Status.PENDING
            ).exists()

            if unpaid_fees:
                raise serializers.ValidationError({
                    "fees": "Certificate cannot be issued. Student has pending fees."
                })

        if student and course and not BatchStudent.objects.filter(student=student, batch__course=course).exists():
            raise serializers.ValidationError({
                "course": "Student is not enrolled in the selected course."
            })

        return attrs


class BatchSerializer(serializers.ModelSerializer):
    course_id = serializers.IntegerField(read_only=True)
    course_name = serializers.CharField(
        source="course.name",
        read_only=True,
    )
    trainer_name = serializers.CharField(
        source="trainer.full_name",
        read_only=True,
        default=None,
    )
    enrolled_count = serializers.SerializerMethodField()

    class Meta:
        model = Batch
        fields = [
            "id",
            "course",
            "course_id",
            "course_name",
            "name",
            "start_date",
            "end_date",
            "capacity",
            "enrolled_count",
            "trainer",
            "trainer_name",
            "status",
            "is_active",
        ]
        read_only_fields = [
            "id",
            "course_id",
            "course_name",
            "trainer_name",
            "enrolled_count",
        ]

    def get_enrolled_count(self, obj):
        return obj.students.count()

    def validate_capacity(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Capacity must be greater than 0."
            )
        return value

    def validate(self, attrs):
        start_date = attrs.get(
            "start_date",
            getattr(self.instance, "start_date", None),
        )
        end_date = attrs.get(
            "end_date",
            getattr(self.instance, "end_date", None),
        )

        if (
            start_date
            and end_date
            and end_date < start_date
        ):
            raise serializers.ValidationError({
                "end_date": "End date cannot be before start date."
            })

        return attrs


class AdminAcademyFeeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source="student.full_name",
        read_only=True,
    )
    student_email = serializers.CharField(
        source="student.email",
        read_only=True,
    )
    batch_name = serializers.CharField(
        source="batch.name",
        read_only=True,
    )
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = AcademyFee
        fields = [
            "id",
            "student",
            "student_name",
            "student_email",
            "batch",
            "batch_name",
            "amount",
            "due_date",
            "paid_date",
            "status",
            "is_overdue",
        ]
        read_only_fields = [
            "id",
            "student_name",
            "student_email",
            "batch_name",
            "paid_date",
            "status",
            "is_overdue",
        ]

    def get_is_overdue(self, obj):
        return (
            obj.status == "PENDING"
            and obj.due_date < timezone.now().date()
        )

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Fee amount must be greater than 0."
            )
        return value

    def validate(self, attrs):
        student = attrs.get(
            "student",
            getattr(self.instance, "student", None),
        )
        batch = attrs.get(
            "batch",
            getattr(self.instance, "batch", None),
        )

        if student and batch:
            if not BatchStudent.objects.filter(
                student=student,
                batch=batch,
            ).exists():
                raise serializers.ValidationError({
                    "batch": "Student is not enrolled in the selected batch."
                })

            if self.instance is None:
                if AcademyFee.objects.filter(
                    student=student,
                    batch=batch,
                ).exists():
                    raise serializers.ValidationError({
                        "batch": "A fee record already exists for this student and batch."
                    })

        if (
            self.instance is not None
            and self.instance.status == AcademyFee.Status.PAID
            and "amount" in attrs
            and attrs["amount"] != self.instance.amount
        ):
            raise serializers.ValidationError({
                "amount": "Amount cannot be changed on a fee that has already been paid."
            })

        return attrs