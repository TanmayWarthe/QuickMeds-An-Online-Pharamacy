"""
WSGI config for quickmeds project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/wsgi/
"""

import os
import sys

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickmeds.settings')

# Only run strict startup checks in production (not in local development)
# Check if running on Render or other production environment
is_production = os.environ.get('RENDER') or os.environ.get('DJANGO_ENV') == 'prod'

if is_production:
    # Run startup checks before initializing Django
    # This ensures critical environment variables are set
    try:
        from quickmeds.startup_checks import check_required_env_variables
        
        if not check_required_env_variables():
            print("\n❌ CRITICAL: Required environment variables not set.")
            print("   Cannot start application. Check logs above for details.\n")
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ CRITICAL: Startup check failed: {str(e)}\n")
        sys.exit(1)

from django.core.wsgi import get_wsgi_application

application = get_wsgi_application()

