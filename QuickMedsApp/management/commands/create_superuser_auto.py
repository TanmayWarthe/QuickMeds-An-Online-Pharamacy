"""
Auto create superuser from environment variables
Usage: python manage.py create_superuser_auto
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from decouple import config
import os

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates a superuser from environment variables if it does not exist'

    def handle(self, *args, **options):
        # Get credentials from environment
        username = config('DJANGO_SUPERUSER_USERNAME', default='QUICKMEDS')
        email = config('DJANGO_SUPERUSER_EMAIL', default='tanmaywarthe09@gmail.com')
        password = config('DJANGO_SUPERUSER_PASSWORD', default='STW@0427')
        
        # Check if superuser already exists
        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(f'✅ Superuser "{username}" already exists'))
            return
        
        # Create superuser
        try:
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password
            )
            self.stdout.write(self.style.SUCCESS(f'✅ Superuser "{username}" created successfully!'))
            self.stdout.write(self.style.SUCCESS(f'📧 Email: {email}'))
            self.stdout.write(self.style.SUCCESS(f'🔑 Password: {password}'))
            self.stdout.write(self.style.WARNING('⚠️  IMPORTANT: Change the password after first login!'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error creating superuser: {str(e)}'))
