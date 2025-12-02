import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickmeds.settings')
django.setup()

from django.db import connection

cursor = connection.cursor()
cursor.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
""")

tables = [row[0] for row in cursor.fetchall()]

print("\n" + "="*50)
print("PostgreSQL Database: quickmeds_db")
print("="*50)
print("\n✅ Successfully Connected!")
print(f"\n📊 Tables Created: {len(tables)}\n")

for table in tables:
    print(f"  ✓ {table}")

print("\n" + "="*50)
print("✅ PostgreSQL Setup Complete!")
print("="*50 + "\n")
