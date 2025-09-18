#!/usr/bin/env python
"""
Generate a secure Django secret key for production deployment.
Run this script to get a new secret key for your .env file.
"""

from django.core.management.utils import get_random_secret_key

if __name__ == "__main__":
    secret_key = get_random_secret_key()
    print("Generated Django Secret Key:")
    print(f"DJANGO_SECRET_KEY={secret_key}")
    print("\nCopy this key to your environment variables in Render.")
