from django.db import models
from django.conf import settings

PRACTICAL_PASS_PERCENTAGE = 40


class Course(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    duration_months = models.PositiveIntegerField()
    fee = models.DecimalField(max_digits=10, decimal_places=2)
    image_before = models.ImageField(upload_to="courses/", blank=True, null=True)
    image_after  = models.ImageField(upload_to="courses/", blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "courses"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class CourseModule(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="modules",
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "course_modules"
        ordering = ["order"]

    def __str__(self):
        return f"{self.course.name} - {self.title}"


class TrainerProfile(models.Model):
    """Extended profile for TRAINER-role users: photo, bio, specialization."""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="trainer_profile",
        limit_choices_to={"role": "TRAINER"},
    )
    photo = models.ImageField(upload_to="trainer_photos/", blank=True)
    bio = models.TextField(blank=True)
    specialization = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "trainer_profiles"

    def __str__(self):
        return f"Trainer Profile: {self.user.full_name}"


class Batch(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="batches",
    )
    name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    capacity = models.PositiveIntegerField()
    trainer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="trainer_batches",
        limit_choices_to={"role": "TRAINER"},
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "batches"
        verbose_name_plural = "Batches"
        ordering = ["-start_date"]

    def __str__(self):
        return f"{self.name} ({self.course.name})"


class AcademyApplication(models.Model):
    class Status(models.TextChoices):
        PENDING            = "PENDING",            "Pending"
        AWAITING_RESPONSE  = "AWAITING_RESPONSE",  "Awaiting Customer Response"
        APPROVED           = "APPROVED",           "Approved"
        REJECTED           = "REJECTED",           "Rejected"

    class CustomerResponse(models.TextChoices):
        ACCEPTED = "ACCEPTED", "Accepted"
        DECLINED = "DECLINED", "Declined"

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="applications",
        limit_choices_to={"role": "CUSTOMER"},
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    # Customer-provided preferences: schedule (weekday/weekend), timing, motivation
    notes = models.TextField(blank=True, default="")
    # Admin-to-customer notification note
    admin_note = models.TextField(blank=True, default="")
    # Customer's response to admin note
    customer_response = models.CharField(
        max_length=10,
        choices=CustomerResponse.choices,
        null=True,
        blank=True,
    )
    customer_response_at = models.DateTimeField(null=True, blank=True)
    applied_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "academy_applications"
        ordering = ["-applied_at"]

    def __str__(self):
        return f"{self.student.full_name} - {self.course.name}"


class BatchStudent(models.Model):
    batch = models.ForeignKey(
        Batch,
        on_delete=models.CASCADE,
        related_name="students",
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="batch_enrollments",
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "batch_students"
        unique_together = ["batch", "student"]

    def __str__(self):
        return f"{self.student.full_name} in {self.batch.name}"


class AcademyFee(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PAID = "PAID", "Paid"
        OVERDUE = "OVERDUE", "Overdue"

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="academy_fees",
    )
    batch = models.ForeignKey(
        Batch,
        on_delete=models.CASCADE,
        related_name="fees",
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    class Meta:
        db_table = "academy_fees"
        ordering = ["-due_date"]

    def __str__(self):
        return f"{self.student.full_name} - ₹{self.amount}"


class AcademySession(models.Model):
    batch = models.ForeignKey(
        Batch,
        on_delete=models.CASCADE,
        related_name="sessions",
    )
    module = models.ForeignKey(
        CourseModule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sessions",
    )
    title = models.CharField(max_length=200)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    trainer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="academy_sessions",
        limit_choices_to={"role": "TRAINER"},
    )

    class Meta:
        db_table = "academy_sessions"
        ordering = ["-date", "-start_time"]

    def __str__(self):
        return f"{self.batch.name} - {self.title} ({self.date})"


class Attendance(models.Model):
    class Status(models.TextChoices):
        PRESENT = "PRESENT", "Present"
        ABSENT = "ABSENT", "Absent"

    session = models.ForeignKey(
        AcademySession,
        on_delete=models.CASCADE,
        related_name="attendances",
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="attendances",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
    )

    class Meta:
        db_table = "attendance"
        unique_together = ["session", "student"]

    def __str__(self):
        return f"{self.student.full_name} - {self.status}"


class Assessment(models.Model):
    class Type(models.TextChoices):
        THEORY = "THEORY", "Theory"
        PRACTICAL = "PRACTICAL", "Practical"
        FINAL = "FINAL", "Final"

    batch = models.ForeignKey(
        Batch,
        on_delete=models.CASCADE,
        related_name="assessments",
    )
    title = models.CharField(max_length=200)
    assessment_type = models.CharField(
        max_length=20,
        choices=Type.choices,
    )
    max_marks = models.PositiveIntegerField()
    passing_marks = models.PositiveIntegerField(
        null=True,
        blank=True,
    )
    date = models.DateField()

    class Meta:
        db_table = "assessments"
        ordering = ["-date"]

    def __str__(self):
        return f"{self.title} ({self.assessment_type})"


class AssessmentResult(models.Model):
    assessment = models.ForeignKey(
        Assessment,
        on_delete=models.CASCADE,
        related_name="results",
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assessment_results",
    )
    marks_obtained = models.PositiveIntegerField()
    is_passed = models.BooleanField()

    class Meta:
        db_table = "assessment_results"
        unique_together = ["assessment", "student"]

    def __str__(self):
        return (
            f"{self.student.full_name} - "
            f"{self.marks_obtained}/{self.assessment.max_marks}"
        )


class PracticalSession(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="practical_sessions",
    )
    batch = models.ForeignKey(
        Batch,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="practical_sessions",
    )
    trainer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="practical_trainings",
        limit_choices_to={"role": "TRAINER"},
    )
    title = models.CharField(max_length=200)
    date = models.DateField()
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "practical_sessions"
        ordering = ["-date"]

    def __str__(self):
        return f"{self.student.full_name} - {self.title}"


class PracticalEvaluation(models.Model):
    session = models.OneToOneField(
        PracticalSession,
        on_delete=models.CASCADE,
        related_name="evaluation",
    )
    total_marks = models.PositiveIntegerField(default=0)
    max_marks = models.PositiveIntegerField(default=100)
    is_passed = models.BooleanField(default=False)
    feedback = models.TextField(blank=True)
    evaluated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "practical_evaluations"

    def __str__(self):
        return (
            f"{self.session.student.full_name} - "
            f"{self.total_marks}/{self.max_marks}"
        )


class PracticalEvaluationCriteria(models.Model):
    name = models.CharField(max_length=100)
    max_marks = models.PositiveIntegerField(default=20)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "practical_evaluation_criteria"

    def __str__(self):
        return self.name


class PracticalEvaluationScore(models.Model):
    evaluation = models.ForeignKey(
        PracticalEvaluation,
        on_delete=models.CASCADE,
        related_name="scores",
    )
    criteria = models.ForeignKey(
        PracticalEvaluationCriteria,
        on_delete=models.CASCADE,
        related_name="scores",
    )
    marks_obtained = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "practical_evaluation_scores"
        unique_together = ["evaluation", "criteria"]

    def __str__(self):
        return (
            f"{self.criteria.name}: "
            f"{self.marks_obtained}/{self.criteria.max_marks}"
        )


class Certificate(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        ISSUED = "ISSUED", "Issued"
        VERIFIED = "VERIFIED", "Verified"
        REVOKED = "REVOKED", "Revoked"

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="certificates",
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="certificates",
    )
    batch = models.ForeignKey(
        Batch,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="certificates",
    )
    certificate_number = models.CharField(
        max_length=50,
        unique=True,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )
    issued_at = models.DateTimeField(
        null=True,
        blank=True,
    )
    is_verified = models.BooleanField(default=False)

    class Meta:
        db_table = "certificates"
        ordering = ["-issued_at"]

    def __str__(self):
        return (
            f"Cert #{self.certificate_number} - "
            f"{self.student.full_name}"
        )