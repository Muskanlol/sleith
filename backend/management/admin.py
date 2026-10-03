from django.contrib import admin
from .models import Salary

# Register your models here.

@admin.register(Salary)
class SalaryAdmin(admin.ModelAdmin):
    list_display = ("employee", "amount", "month", "status", "paid_date")
    list_filter = ("status", "month")
    search_fields = ("employee__email", "employee__full_name")