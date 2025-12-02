import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickmeds.settings')
django.setup()

from django.contrib.auth.models import User

print("=" * 60)
print("CHECKING FOR DUPLICATE EMAILS")
print("=" * 60)

# Find duplicate emails
from django.db.models import Count

duplicate_emails = User.objects.values('email').annotate(
    count=Count('email')
).filter(count__gt=1, email__isnull=False).exclude(email='')

if not duplicate_emails:
    print("\n✅ No duplicate emails found!")
else:
    print(f"\n⚠️  Found {len(duplicate_emails)} duplicate email(s):\n")
    
    for dup in duplicate_emails:
        email = dup['email']
        users = User.objects.filter(email=email)
        
        print(f"Email: {email}")
        print(f"Users with this email:")
        for user in users:
            print(f"  - Username: {user.username}")
            print(f"    Superuser: {user.is_superuser}")
            print(f"    Staff: {user.is_staff}")
            print(f"    Date joined: {user.date_joined}")
            print(f"    Last login: {user.last_login}")
        print()

print("\n" + "=" * 60)
print("ALL ADMIN USERS (STAFF/SUPERUSER)")
print("=" * 60)

admins = User.objects.filter(is_staff=True) | User.objects.filter(is_superuser=True)
admins = admins.distinct()

for admin in admins:
    print(f"\nUsername: {admin.username}")
    print(f"Email: {admin.email or 'Not set'}")
    print(f"Superuser: {admin.is_superuser}")
    print(f"Staff: {admin.is_staff}")
    print(f"Date joined: {admin.date_joined}")

print("\n" + "=" * 60)
print("\nTo remove duplicate users, use Django admin or delete manually.")
print("Recommendation: Keep the superuser account and remove duplicates.")
print("=" * 60)
