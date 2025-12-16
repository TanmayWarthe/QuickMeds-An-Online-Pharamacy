"""
Centralized Cloudinary Configuration Module
This module handles all Cloudinary initialization and configuration.
"""

import os
import logging
import cloudinary
import cloudinary.uploader
import cloudinary.api

logger = logging.getLogger(__name__)


class CloudinaryConfigError(Exception):
    """Custom exception for Cloudinary configuration errors"""
    pass


def validate_cloudinary_env():
    """
    Validates that all required Cloudinary environment variables are set.
    Raises CloudinaryConfigError if any are missing.
    
    For local development, tries to load from python-decouple first.
    """
    # Try to load from decouple (reads .env file)
    try:
        from decouple import config as decouple_config
        required_vars = {
            'CLOUDINARY_CLOUD_NAME': decouple_config('CLOUDINARY_CLOUD_NAME', default=None),
            'CLOUDINARY_API_KEY': decouple_config('CLOUDINARY_API_KEY', default=None),
            'CLOUDINARY_API_SECRET': decouple_config('CLOUDINARY_API_SECRET', default=None),
        }
    except ImportError:
        # Fallback to os.environ if decouple not available
        required_vars = {
            'CLOUDINARY_CLOUD_NAME': os.environ.get('CLOUDINARY_CLOUD_NAME'),
            'CLOUDINARY_API_KEY': os.environ.get('CLOUDINARY_API_KEY'),
            'CLOUDINARY_API_SECRET': os.environ.get('CLOUDINARY_API_SECRET'),
        }
    
    missing_vars = [key for key, value in required_vars.items() if not value]
    
    if missing_vars:
        error_msg = (
            f"❌ CRITICAL: Missing Cloudinary environment variables: {', '.join(missing_vars)}\n"
            f"   Please set these in your .env file (local) or Render dashboard (production).\n"
            f"   Current environment variables starting with 'CLOUDINARY':\n"
            f"   {[key for key in os.environ.keys() if key.startswith('CLOUDINARY')]}"
        )
        logger.error(error_msg)
        raise CloudinaryConfigError(error_msg)
    
    # Log successful validation (with masked secrets)
    logger.info(
        f"✓ Cloudinary configuration validated:\n"
        f"  - CLOUD_NAME: {required_vars['CLOUDINARY_CLOUD_NAME']}\n"
        f"  - API_KEY: {required_vars['CLOUDINARY_API_KEY'][:4]}...{required_vars['CLOUDINARY_API_KEY'][-4:]}\n"
        f"  - API_SECRET: {'*' * 8} (set)"
    )
    
    return required_vars


def configure_cloudinary():
    """
    Configures Cloudinary with environment variables.
    This should be called during Django startup.
    
    Returns:
        dict: The configuration dictionary used
    """
    try:
        # Validate environment variables first
        config_vars = validate_cloudinary_env()
        
        # Configure Cloudinary
        cloudinary.config(
            cloud_name=config_vars['CLOUDINARY_CLOUD_NAME'],
            api_key=config_vars['CLOUDINARY_API_KEY'],
            api_secret=config_vars['CLOUDINARY_API_SECRET'],
            secure=True  # Always use HTTPS
        )
        
        logger.info("✓ Cloudinary configured successfully")
        
        # Return the configuration for CLOUDINARY_STORAGE setting
        return {
            'CLOUD_NAME': config_vars['CLOUDINARY_CLOUD_NAME'],
            'API_KEY': config_vars['CLOUDINARY_API_KEY'],
            'API_SECRET': config_vars['CLOUDINARY_API_SECRET']
        }
        
    except CloudinaryConfigError:
        # Re-raise our custom error
        raise
    except Exception as e:
        error_msg = f"❌ Failed to configure Cloudinary: {str(e)}"
        logger.error(error_msg)
        raise CloudinaryConfigError(error_msg) from e


def get_cloudinary_config():
    """
    Returns the current Cloudinary configuration.
    Useful for debugging.
    """
    config = cloudinary.config()
    return {
        'cloud_name': config.cloud_name,
        'api_key': config.api_key[:4] + '...' + config.api_key[-4:] if config.api_key else None,
        'secure': config.secure,
    }


# Configure Cloudinary when this module is imported
# This ensures it's configured before Django models are loaded
try:
    CLOUDINARY_STORAGE_CONFIG = configure_cloudinary()
    print("✅ Cloudinary configured successfully at module import")
except CloudinaryConfigError as e:
    # Check if we're in production or development
    is_production = os.environ.get('RENDER') or os.environ.get('DJANGO_ENV') == 'prod'
    
    if is_production:
        # Production mode - fail immediately
        logger.error(f"❌ PRODUCTION: Cloudinary configuration failed: {str(e)}")
        raise
    else:
        # Development mode - log warning but allow startup
        # However, templates will fail when trying to use cloudinary
        print(f"⚠️  WARNING: Cloudinary not configured!")
        print(f"   Error: {str(e)}")
        print(f"   Check your .env file has CLOUDINARY_* variables")
        CLOUDINARY_STORAGE_CONFIG = {}
        
        # Still configure with empty values to prevent template errors
        cloudinary.config(
            cloud_name="placeholder",
            api_key="placeholder",
            api_secret="placeholder"
        )
