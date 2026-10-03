from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("academy", "0011_add_trainer_profile"),
    ]

    operations = [
        migrations.AddField(
            model_name="course",
            name="image_after",
            field=models.ImageField(blank=True, null=True, upload_to="courses/"),
        ),
        migrations.AddField(
            model_name="course",
            name="image_before",
            field=models.ImageField(blank=True, null=True, upload_to="courses/"),
        ),
    ]
