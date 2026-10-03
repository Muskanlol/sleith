from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("salon", "0017_add_whatsapp_message"),
    ]

    operations = [
        migrations.AddField(
            model_name="service",
            name="image",
            field=models.ImageField(blank=True, null=True, upload_to="service_photos/"),
        ),
    ]
