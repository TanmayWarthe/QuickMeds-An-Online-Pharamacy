import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickmeds.settings')
django.setup()

from django.contrib.auth.models import User

# List all superusers
superusers = User.objects.filter(is_superuser=True)

if not superusers.exists():
    print("No superuser found. Creating a new one...")
    username = input("Enter username: ")
    email = input("Enter email: ")
    password = input("Enter password: ")
    
    user = User.objects.create_superuser(username=username, email=email, password=password)
    user.is_staff = True
    user.save()
    print(f"\n✅ Superuser '{username}' created successfully!")
else:
    print("Existing superusers:")
    for i, user in enumerate(superusers, 1):
        print(f"{i}. Username: {user.username}, Email: {user.email or 'Not set'}")
    
    choice = input("\nEnter number to update (or 'n' to create new): ")
    
    if choice.lower() == 'n':
        username = input("Enter new username: ")
        email = input("Enter new email: ")
        password = input("Enter new password: ")
        
        user = User.objects.create_superuser(username=username, email=email, password=password)
        user.is_staff = True
        user.save()
        print(f"\n✅ New superuser '{username}' created successfully!")
    else:
        try:
            user = list(superusers)[int(choice) - 1]
            print(f"\nUpdating user: {user.username}")
            
            new_email = input(f"Enter new email (current: {user.email or 'Not set'}): ")
            if new_email:
                user.email = new_email
            
            change_password = input("Change password? (y/n): ")
            if change_password.lower() == 'y':
                new_password = input("Enter new password: ")
                user.set_password(new_password)
            
            user.is_staff = True
            user.save()
            print(f"\n✅ Superuser '{user.username}' updated successfully!")
            print(f"   Email: {user.email}")
        except (ValueError, IndexError):
            print("Invalid choice!")
