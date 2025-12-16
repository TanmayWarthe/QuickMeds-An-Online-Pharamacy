"""
Startup checks for critical configuration
Run these checks before starting the Django server
"""

import os
import sys
import logging

logger = logging.getLogger(__name__)


def check_required_env_variables():
    """
    Check that all required environment variables are set.
    Returns True if all checks pass, False otherwise.
    """
    checks_passed = True
    
    # Critical environment variables
    required_vars = {
        'DJANGO_SECRET_KEY': 'Django secret key',
        'CLOUDINARY_CLOUD_NAME': 'Cloudinary cloud name',
        'CLOUDINARY_API_KEY': 'Cloudinary API key',
        'CLOUDINARY_API_SECRET': 'Cloudinary API secret',
    }
    
    # Optional but recommended
    recommended_vars = {
        'DEBUG': 'Debug mode setting',
        'USE_CLOUDINARY': 'Enable Cloudinary storage',
        'DATABASE_URL': 'Database connection string',
    }
    
    print("\n" + "="*70)
    print("🔍 ENVIRONMENT VARIABLES CHECK")
    print("="*70)
    
    # Check required variables
    print("\n✓ Required Variables:")
    missing_required = []
    for var, description in required_vars.items():
        value = os.environ.get(var)
        if value:
            # Mask sensitive values
            if 'SECRET' in var or 'KEY' in var:
                display_value = f"{value[:4]}...{value[-4:]}" if len(value) > 8 else "***"
            else:
                display_value = value
            print(f"  ✓ {var}: {display_value}")
        else:
            print(f"  ✗ {var}: NOT SET ({description})")
            missing_required.append(var)
            checks_passed = False
    
    # Check recommended variables
    print("\n⚠ Recommended Variables:")
    for var, description in recommended_vars.items():
        value = os.environ.get(var)
        if value:
            print(f"  ✓ {var}: {value}")
        else:
            print(f"  ⚠ {var}: NOT SET ({description}) - Using default")
    
    # Summary
    print("\n" + "="*70)
    if checks_passed:
        print("✅ All required environment variables are set!")
    else:
        print(f"❌ Missing required variables: {', '.join(missing_required)}")
        print("\n🔧 Fix this issue:")
        print("   1. On Render dashboard, go to your service")
        print("   2. Click 'Environment' tab")
        print("   3. Add the missing variables")
        print("   4. Redeploy your service")
    print("="*70 + "\n")
    
    return checks_passed


def run_startup_checks():
    """
    Run all startup checks.
    Exit with error code 1 if any critical check fails.
    """
    print("\n🚀 Running startup checks...")
    
    if not check_required_env_variables():
        print("\n❌ Startup checks failed. Cannot start server.")
        print("   Please fix the issues above and try again.\n")
        sys.exit(1)
    
    print("✅ All startup checks passed!\n")


if __name__ == "__main__":
    run_startup_checks()
