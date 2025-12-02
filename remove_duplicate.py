import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickmeds.settings')
django.setup()

from django.contrib.auth.models import User

email = "tanmaywarthe09@gmail.com"

# Get the duplicate regular user (not admin)
duplicate_user = User.objects.filter(
    email=email,
    is_superuser=False,
    is_staff=False
).first()

if duplicate_user:
    print(f"Found duplicate regular user:")
    print(f"  Username: {duplicate_user.username}")
    print(f"  Email: {duplicate_user.email}")
    print(f"  Superuser: {duplicate_user.is_superuser}")
    print(f"  Staff: {duplicate_user.is_staff}")
    
    confirm = input("\nDelete this user? (yes/no): ")
    
    if confirm.lower() == 'yes':
        duplicate_user.delete()
        print(f"\n✅ User '{duplicate_user.username}' deleted successfully!")
        print(f"\nRemaining admin user:")
        admin = User.objects.get(username='QUICKMEDS')
        print(f"  Username: {admin.username}")
        print(f"  Email: {admin.email}")
        print(f"  Superuser: {admin.is_superuser}")
        print(f"  Staff: {admin.is_staff}")
    else:
        print("\nCancelled.")
else:
    print("No duplicate user found.")
