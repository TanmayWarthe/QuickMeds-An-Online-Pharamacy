import os
import django
from django.core.mail import send_mail
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickmeds.settings')
django.setup()

try:
    send_mail(
        'Test Email',
        'This is a test email.',
        settings.EMAIL_HOST_USER,
        [settings.EMAIL_HOST_USER],
        fail_silently=False,
    )
    print('Email sent successfully!')
except Exception as e:
    print(f'Error sending email: {e}') 