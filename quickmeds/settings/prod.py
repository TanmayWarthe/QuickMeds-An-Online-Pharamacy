from .base import *  # noqa: F401,F403
from decouple import config, Csv

# Production settings
DEBUG = config("DEBUG", default=False, cast=bool)

# Hosts and CSRF
ALLOWED_HOSTS = config(
    "ALLOWED_HOSTS",
    default="dawai-ki-dukan-j67h.onrender.com,.onrender.com",
    cast=Csv(),
)

# Trust Render domains by default
default_csrf_origins = ["https://*.onrender.com"]
CSRF_TRUSTED_ORIGINS = config(
    "CSRF_TRUSTED_ORIGINS",
    default=",".join(default_csrf_origins),
    cast=Csv(),
)

# Security hardening
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Require real secret in production
if not SECRET_KEY or SECRET_KEY.startswith("dev-secret-key"):
    raise RuntimeError("DJANGO_SECRET_KEY must be set to a strong value in production.")

# Database: Prefer DATABASE_URL, fallback to MySQL env vars
database_url = config("DATABASE_URL", default=None)
if database_url:
    import dj_database_url

    DATABASES = {  # noqa: F405
        "default": dj_database_url.parse(database_url, conn_max_age=600, ssl_require=False)
    }
else:
    DATABASES = {  # noqa: F405
        "default": {
            "ENGINE": "django.db.backends.mysql",
            "NAME": config("DB_NAME", default="quickmeds_db"),
            "USER": config("DB_USER", default="quickmeds_user"),
            "PASSWORD": config("DB_PASSWORD", default=""),
            "HOST": config("DB_HOST", default="127.0.0.1"),
            "PORT": config("DB_PORT", default="3306"),
            "OPTIONS": {
                "init_command": "SET sql_mode='STRICT_TRANS_TABLES'",
                "charset": "utf8mb4",
            },
        }
    }

# Static files: optimized storage
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Media: Use Cloudinary if enabled
if config("USE_CLOUDINARY", default=False, cast=bool):
    CLOUDINARY_STORAGE = {
        "CLOUD_NAME": config("CLOUDINARY_CLOUD_NAME", default=""),
        "API_KEY": config("CLOUDINARY_API_KEY", default=""),
        "API_SECRET": config("CLOUDINARY_API_SECRET", default=""),
    }
    DEFAULT_FILE_STORAGE = "cloudinary_storage.storage.MediaCloudinaryStorage"

# Logging: more conservative by default in prod
LOGGING["root"]["level"] = "WARNING"  # noqa: F405
LOGGING["loggers"]["django"]["level"] = "WARNING"  # noqa: F405
