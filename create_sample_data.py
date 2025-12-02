import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickmeds.settings')
django.setup()

from QuickMedsApp.models import Category, Product
from decimal import Decimal
from datetime import datetime, timedelta

print("Creating sample data for admin panel testing...\n")

# Create categories
categories_data = [
    "Pain Relief",
    "Vitamins & Supplements",
    "First Aid",
    "Cold & Flu",
    "Digestive Health"
]

categories = []
for cat_name in categories_data:
    cat, created = Category.objects.get_or_create(name=cat_name)
    if created:
        print(f"✅ Created category: {cat_name}")
    categories.append(cat)

# Create sample products
products_data = [
    {
        "name": "Paracetamol 500mg",
        "category": categories[0],
        "price": Decimal("45.00"),
        "stock": 150,
        "description": "Effective pain relief and fever reducer",
        "in_stock": True,
    },
    {
        "name": "Vitamin C 1000mg",
        "category": categories[1],
        "price": Decimal("299.00"),
        "stock": 8,  # Low stock
        "description": "Immune system support",
        "in_stock": True,
    },
    {
        "name": "Band-Aid Variety Pack",
        "category": categories[2],
        "price": Decimal("125.00"),
        "stock": 3,  # Very low stock
        "description": "Assorted sizes for all cuts",
        "in_stock": True,
    },
    {
        "name": "Cough Syrup",
        "category": categories[3],
        "price": Decimal("180.00"),
        "stock": 45,
        "description": "Relieves cough and cold symptoms",
        "in_stock": True,
    },
    {
        "name": "Antacid Tablets",
        "category": categories[4],
        "price": Decimal("89.00"),
        "stock": 0,  # Out of stock
        "description": "Fast relief from heartburn",
        "in_stock": False,
    },
    {
        "name": "Multivitamin Daily",
        "category": categories[1],
        "price": Decimal("450.00"),
        "stock": 75,
        "description": "Complete daily nutrition",
        "in_stock": True,
    },
]

print("\nCreating products...")
for prod_data in products_data:
    product, created = Product.objects.get_or_create(
        name=prod_data["name"],
        defaults=prod_data
    )
    if created:
        status = "✅"
        if prod_data["stock"] == 0:
            status = "⚠️  OUT OF STOCK"
        elif prod_data["stock"] <= 5:
            status = "⚠️  LOW STOCK"
        print(f"{status} {prod_data['name']} - Stock: {prod_data['stock']}")

print("\n" + "=" * 60)
print("✅ Sample data created successfully!")
print("=" * 60)
print(f"Categories: {Category.objects.count()}")
print(f"Products: {Product.objects.count()}")
print(f"Low Stock Products: {Product.objects.filter(stock__lte=10).count()}")
print("\nYou can now view these in the admin panel!")
