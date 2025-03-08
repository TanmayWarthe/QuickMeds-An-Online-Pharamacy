from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('QuickMedsApp', '0012_alter_address_options_and_more'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='address',
            options={'ordering': ['-created_at'], 'verbose_name': 'Address', 'verbose_name_plural': 'Addresses'},
        ),
        migrations.AddField(
            model_name='address',
            name='is_default',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='address',
            name='type',
            field=models.CharField(choices=[('Home', 'Home'), ('Office', 'Office'), ('Other', 'Other')], default='Home', max_length=20),
        ),
        migrations.AlterField(
            model_name='address',
            name='user',
            field=models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='addresses', to='auth.user'),
        ),
    ] 