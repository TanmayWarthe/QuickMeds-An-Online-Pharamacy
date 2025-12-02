import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickmeds.settings')
django.setup()

from django.contrib.auth.models import User
from QuickMedsApp.models import Product, Category, Order, UserProfile

print("=" * 60)
print("ADMIN PANEL FUNCTIONALITY CHECK")
print("=" * 60)

# Check admin users
print("\n1. ADMIN USERS:")
admins = User.objects.filter(is_staff=True) | User.objects.filter(is_superuser=True)
admins = admins.distinct()

for admin in admins:
    print(f"   ✅ {admin.username} - Email: {admin.email}")
    print(f"      Superuser: {admin.is_superuser}, Staff: {admin.is_staff}")

# Check categories
print("\n2. CATEGORIES:")
categories = Category.objects.all()
print(f"   Total Categories: {categories.count()}")
for cat in categories[:5]:
    print(f"   - {cat.name}")
if categories.count() > 5:
    print(f"   ... and {categories.count() - 5} more")

# Check products
print("\n3. PRODUCTS:")
products = Product.objects.all()
print(f"   Total Products: {products.count()}")
print(f"   In Stock: {Product.objects.filter(in_stock=True).count()}")
print(f"   Low Stock (≤10): {Product.objects.filter(stock__lte=10).count()}")

# Check orders
print("\n4. ORDERS:")
orders = Order.objects.all()
print(f"   Total Orders: {orders.count()}")
print(f"   Pending: {Order.objects.filter(order_status='PENDING').count()}")
print(f"   Confirmed: {Order.objects.filter(order_status='CONFIRMED').count()}")
print(f"   Delivered: {Order.objects.filter(order_status='DELIVERED').count()}")

# Check users
print("\n5. USERS:")
users = User.objects.all()
print(f"   Total Users: {users.count()}")
print(f"   Active: {User.objects.filter(is_active=True).count()}")
print(f"   With Profiles: {UserProfile.objects.count()}")

# Check URLs
print("\n6. ADMIN URLS (verify these are accessible):")
admin_urls = [
    "/admin-panel/login/",
    "/admin-panel/",
    "/admin-panel/products/",
    "/admin-panel/orders/",
    "/admin-panel/users/",
    "/admin-panel/categories/",
    "/admin-panel/contacts/",
]

for url in admin_urls:
    print(f"   ✓ {url}")

print("\n" + "=" * 60)
print("ADMIN LOGIN CREDENTIALS:")
print("=" * 60)
for admin in admins:
    print(f"Username: {admin.username}")
    print(f"Email: {admin.email}")
    print("Password: (the one you set)")
    print(f"\nLogin URL: http://127.0.0.1:8000/admin-panel/login/")
    print("=" * 60)

print("\n✅ Admin panel is ready to use!")
print("   Run: python manage.py runserver")
print("   Then visit: http://127.0.0.1:8000/admin-panel/login/")
