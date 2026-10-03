from django.core.management.base import BaseCommand
from salon.whatsapp import send_tomorrow_reminders


class Command(BaseCommand):
    help = "Send WhatsApp reminders for confirmed and rescheduled appointments happening tomorrow."

    def handle(self, *args, **options):
        result = send_tomorrow_reminders()
        self.stdout.write(
            self.style.SUCCESS(
                f"Reminders for {result['date']}: "
                f"{result['sent']} sent, {result['failed']} failed, {result['skipped']} skipped."
            )
        )
