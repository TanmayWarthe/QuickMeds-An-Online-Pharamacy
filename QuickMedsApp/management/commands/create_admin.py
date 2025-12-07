"""
Django management command to create a superuser from environment variables.
This allows creating admin users during deployment without interactive shell access.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from decouple import config


class Command(BaseCommand):
    help = 'Creates a superuser from environment variables if it does not exist'

    def handle(self, *args, **options):
        # Get admin credentials from environment variables
        admin_username = config('ADMIN_USERNAME', default='admin')
        admin_email = config('ADMIN_EMAIL', default='admin@quickmeds.com')
        admin_password = config('ADMIN_PASSWORD', default=None)

        if not admin_password:
            self.stdout.write(
                self.style.WARNING(
                    'No ADMIN_PASSWORD environment variable set. Skipping superuser creation.'
                )
            )
            return

        # Check if user already exists
        if User.objects.filter(username=admin_username).exists():
            self.stdout.write(
                self.style.SUCCESS(
                    f'Superuser "{admin_username}" already exists.'
                )
            )
            return

        # Create superuser
        try:
            User.objects.create_superuser(
                username=admin_username,
                email=admin_email,
                password=admin_password
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f'Superuser "{admin_username}" created successfully!'
                )
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(
                    f'Error creating superuser: {str(e)}'
                )
            )
