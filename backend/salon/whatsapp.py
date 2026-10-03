import re
from datetime import timedelta
from django.conf import settings
from django.utils import timezone

from .models import WhatsAppMessage


def normalize_phone(raw):
    if not raw:
        return None
    digits = re.sub(r"\D", "", str(raw))
    if len(digits) == 10:
        return f"+91{digits}"
    if digits.startswith("91") and len(digits) == 12:
        return f"+{digits}"
    if str(raw).strip().startswith("+") and len(digits) >= 10:
        return f"+{digits}"
    return None


def _service_names(appointment):
    names = list(appointment.services.values_list("service__name", flat=True))
    return ", ".join(names) if names else "your service"


def _when(appointment):
    date = appointment.appointment_date.strftime("%d %b %Y")
    time = appointment.start_time.strftime("%I:%M %p").lstrip("0")
    return f"{date} at {time}"


def build_body(appointment, kind):
    name = (getattr(appointment.customer, "full_name", None) or "there").split()[0]
    staff = getattr(getattr(appointment.staff, "user", None), "full_name", None) or "our stylist"
    when = _when(appointment)
    services = _service_names(appointment)

    if kind == WhatsAppMessage.Kind.CONFIRMATION:
        return (
            f"Hi {name}, your SLEITH appointment is confirmed for {when} "
            f"with {staff} ({services}). We look forward to seeing you."
        )
    if kind == WhatsAppMessage.Kind.REMINDER_24H:
        return (
            f"Hi {name}, reminder: your SLEITH appointment is tomorrow — {when} "
            f"with {staff} ({services}). See you soon!"
        )
    if kind == WhatsAppMessage.Kind.CANCELLED:
        return (
            f"Hi {name}, your SLEITH appointment on {when} with {staff} "
            f"has been cancelled. Book again anytime on our website."
        )
    if kind == WhatsAppMessage.Kind.RESCHEDULED:
        return (
            f"Hi {name}, your SLEITH appointment has been rescheduled to {when} "
            f"with {staff} ({services})."
        )
    return f"Hi {name}, an update on your SLEITH appointment: {when}."


def already_sent(appointment, kind):
    return WhatsAppMessage.objects.filter(
        appointment=appointment,
        kind=kind,
        status=WhatsAppMessage.Status.SENT,
    ).exists()


def send_whatsapp(appointment, kind, force=False):
    """Send a real WhatsApp message via Twilio. Never raises to the caller."""
    if not force and already_sent(appointment, kind):
        return None

    phone = normalize_phone(getattr(appointment.customer, "phone", ""))
    body = build_body(appointment, kind)

    if not phone:
        return WhatsAppMessage.objects.create(
            appointment=appointment,
            kind=kind,
            phone="",
            body=body,
            status=WhatsAppMessage.Status.SKIPPED,
            error="Customer has no valid phone number.",
        )

    sid = getattr(settings, "TWILIO_ACCOUNT_SID", "") or ""
    token = getattr(settings, "TWILIO_AUTH_TOKEN", "") or ""
    sender = getattr(settings, "TWILIO_WHATSAPP_FROM", "") or ""

    if not sid or not token or not sender:
        return WhatsAppMessage.objects.create(
            appointment=appointment,
            kind=kind,
            phone=phone,
            body=body,
            status=WhatsAppMessage.Status.FAILED,
            error="Twilio WhatsApp credentials are not configured.",
        )

    if not sender.startswith("whatsapp:"):
        sender = f"whatsapp:{sender}"

    try:
        from twilio.rest import Client

        Client(sid, token).messages.create(
            from_=sender,
            to=f"whatsapp:{phone}",
            body=body,
        )
        return WhatsAppMessage.objects.create(
            appointment=appointment,
            kind=kind,
            phone=phone,
            body=body,
            status=WhatsAppMessage.Status.SENT,
        )
    except Exception as exc:
        return WhatsAppMessage.objects.create(
            appointment=appointment,
            kind=kind,
            phone=phone,
            body=body,
            status=WhatsAppMessage.Status.FAILED,
            error=str(exc)[:500],
        )


def notify_status_change(appointment, old_status, new_status):
    if old_status == new_status:
        return
    if new_status == appointment.Status.CONFIRMED:
        send_whatsapp(appointment, WhatsAppMessage.Kind.CONFIRMATION)
    elif new_status == appointment.Status.CANCELLED:
        send_whatsapp(appointment, WhatsAppMessage.Kind.CANCELLED)
    elif new_status == appointment.Status.RESCHEDULED:
        send_whatsapp(appointment, WhatsAppMessage.Kind.RESCHEDULED, force=True)


def send_tomorrow_reminders():
    from .models import Appointment

    tomorrow = timezone.localdate() + timedelta(days=1)
    qs = Appointment.objects.filter(
        status__in=[Appointment.Status.CONFIRMED, Appointment.Status.RESCHEDULED],
        appointment_date=tomorrow,
    ).select_related("customer", "staff__user").prefetch_related("services__service")

    sent = failed = skipped = 0
    for appointment in qs:
        record = send_whatsapp(appointment, WhatsAppMessage.Kind.REMINDER_24H)
        if record is None:
            skipped += 1
        elif record.status == WhatsAppMessage.Status.SENT:
            sent += 1
        elif record.status == WhatsAppMessage.Status.SKIPPED:
            skipped += 1
        else:
            failed += 1
    return {"sent": sent, "failed": failed, "skipped": skipped, "date": str(tomorrow)}
