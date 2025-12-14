import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickmeds.settings')
django.setup()

from django.db import connection
from django.conf import settings

print("🔍 Database Configuration:")
print(f"Engine: {settings.DATABASES['default']['ENGINE']}")
print(f"Name: {settings.DATABASES['default'].get('NAME', 'N/A')}")
print(f"Host: {settings.DATABASES['default'].get('HOST', 'N/A')}")
print(f"Port: {settings.DATABASES['default'].get('PORT', 'N/A')}")
print("=" * 50)

with connection.cursor() as cursor:
    # Get all tables
    if 'postgresql' in settings.DATABASES['default']['ENGINE']:
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
    else:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    
    tables = cursor.fetchall()
    
    print("📊 Tables in Database:")
    print("=" * 50)
    for table in tables:
        print(f"✓ {table[0]}")
    print("=" * 50)
    print(f"Total tables: {len(tables)}")
