from django.db import models
from django.conf import settings


class ContactInquiry(models.Model):
    class Status(models.TextChoices):
        NEW      = "NEW",      "New"
        READ     = "READ",     "Read"
        RESOLVED = "RESOLVED", "Resolved"

    name    = models.CharField(max_length=150)
    email   = models.EmailField()
    phone   = models.CharField(max_length=20, blank=True)
    subject = models.CharField(max_length=200)
    message = models.TextField()
    status  = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "contact_inquiries"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} — {self.subject}"


class Salary(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PAID = "PAID", "Paid"

    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="salaries",
        limit_choices_to={"role__in": ["STAFF", "MANAGER", "TRAINER"]},
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    month = models.DateField(help_text="Use the 1st of the salary month, e.g. 2026-09-01")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    paid_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "salaries"
        unique_together = ["employee", "month"]
        ordering = ["-month"]

    def __str__(self):
        return f"{self.employee.full_name} - {self.month.strftime('%b %Y')} - {self.status}"