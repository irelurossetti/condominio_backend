from django.db import migrations
from django.contrib.postgres.operations import BtreeGistExtension

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0008_maintenancerequestattachment'),
    ]
    operations = [
        BtreeGistExtension(),  # idempotente
    ]
