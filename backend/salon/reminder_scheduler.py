import os
import sys
import threading
import time
from pathlib import Path

from django.conf import settings
from django.utils import timezone


def _lock_path():
    return Path(settings.BASE_DIR) / ".reminders_last_run"


def _should_run():
    now = timezone.localtime()
    if now.hour < 9:
        return False
    today = str(now.date())
    path = _lock_path()
    if path.exists() and path.read_text(encoding="utf-8").strip() == today:
        return False
    return True


def _loop():
    from salon.whatsapp import send_tomorrow_reminders

    while True:
        try:
            if _should_run():
                send_tomorrow_reminders()
                _lock_path().write_text(str(timezone.localdate()), encoding="utf-8")
        except Exception:
            pass
        time.sleep(60 * 30)


def start_reminder_scheduler():
    if os.environ.get("SLEITH_REMINDERS", "1") == "0":
        return
    if "runserver" in sys.argv and os.environ.get("RUN_MAIN") != "true":
        return
    skip = {"migrate", "makemigrations", "shell", "test", "collectstatic"}
    if skip.intersection(sys.argv):
        return
    thread = threading.Thread(target=_loop, daemon=True, name="sleith-reminders")
    thread.start()
