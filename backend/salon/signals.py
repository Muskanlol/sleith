from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver

from .models import Appointment
from .whatsapp import notify_status_change


@receiver(pre_save, sender=Appointment)
def _cache_old_appointment_status(sender, instance, **kwargs):
    if not instance.pk:
        instance._old_status = None
        return
    try:
        instance._old_status = Appointment.objects.get(pk=instance.pk).status
    except Appointment.DoesNotExist:
        instance._old_status = None


@receiver(post_save, sender=Appointment)
def _whatsapp_on_appointment_status(sender, instance, created, **kwargs):
    if created:
        return
    old_status = getattr(instance, "_old_status", None)
    if old_status == instance.status:
        return
    appointment = (
        Appointment.objects.select_related("customer", "staff__user")
        .prefetch_related("services__service")
        .get(pk=instance.pk)
    )
    notify_status_change(appointment, old_status, appointment.status)
