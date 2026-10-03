from django.contrib import admin
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
    PracticalEvaluationCriteria
)


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("name", "duration_months", "fee", "is_active")
    search_fields = ("name", "description")
    fields = (
        "name", "description", "duration_months", "fee",
        "image_before", "image_after", "is_active",
    )


@admin.register(CourseModule)
class CourseModuleAdmin(admin.ModelAdmin):
    list_display = ("course", "title", "order")
    list_filter = ("course",)


@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = ("name", "course", "start_date", "end_date", "capacity", "trainer", "is_active")
    list_filter = ("course", "is_active")


@admin.register(AcademyApplication)
class AcademyApplicationAdmin(admin.ModelAdmin):
    list_display = ("student", "course", "status", "applied_at")
    list_filter = ("status", "course")


@admin.register(BatchStudent)
class BatchStudentAdmin(admin.ModelAdmin):
    list_display = ("batch", "student", "enrolled_at")
    list_filter = ("batch",)


@admin.register(AcademyFee)
class AcademyFeeAdmin(admin.ModelAdmin):
    list_display = ("student", "batch", "amount", "due_date", "status")
    list_filter = ("status",)


@admin.register(AcademySession)
class AcademySessionAdmin(admin.ModelAdmin):
    list_display = ("batch", "title", "date", "start_time", "trainer")
    list_filter = ("batch", "date")


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ("session", "student", "status")
    list_filter = ("status",)


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ("batch", "title", "assessment_type", "max_marks", "date")
    list_filter = ("assessment_type",)


@admin.register(AssessmentResult)
class AssessmentResultAdmin(admin.ModelAdmin):
    list_display = ("assessment", "student", "marks_obtained", "is_passed")
    list_filter = ("is_passed",)


@admin.register(PracticalSession)
class PracticalSessionAdmin(admin.ModelAdmin):
    list_display = ("student", "trainer", "date")
    list_filter = ("date",)


@admin.register(PracticalEvaluation)
class PracticalEvaluationAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'total_marks', 'max_marks', 'is_passed', 'evaluated_at']
    list_filter = ['is_passed', 'evaluated_at']
    search_fields = ['session__student__full_name', 'session__title']

@admin.register(PracticalEvaluationCriteria)
class PracticalEvaluationCriteriaAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'max_marks', 'description']
    search_fields = ['name']



@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ("student", "course", "certificate_number", "issued_at", "is_verified")
    search_fields = ("certificate_number", "student__email")