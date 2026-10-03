from django.apps import AppConfig


class SalonConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "salon"

    def ready(self):
        from . import signals
        from .reminder_scheduler import start_reminder_scheduler

        start_reminder_scheduler()
