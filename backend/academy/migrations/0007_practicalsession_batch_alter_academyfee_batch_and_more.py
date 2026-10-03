from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("academy", "0006_certificate_batch_certificate_status"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="practicalsession",
            name="batch",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="practical_sessions",
                to="academy.batch",
            ),
        ),
        migrations.AlterField(
            model_name="academyfee",
            name="batch",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="fees",
                to="academy.batch",
            ),
        ),
        migrations.AlterField(
            model_name="academysession",
            name="trainer",
            field=models.ForeignKey(
                blank=True,
                limit_choices_to={"role": "TRAINER"},
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="academy_sessions",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name="certificate",
            name="course",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="certificates",
                to="academy.course",
            ),
        ),
        migrations.AlterField(
            model_name="certificate",
            name="issued_at",
            field=models.DateTimeField(
                blank=True,
                null=True,
            ),
        ),
    ]