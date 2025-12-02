from .base import *  # noqa: F401,F403
from decouple import config

# Development settings
DEBUG = config("DEBUG", default=True, cast=bool)

# Allow local hosts by default
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost,127.0.0.1", cast=Csv())

# Helpful for development: ensure static is handled by Django and WhiteNoise in dev
INSTALLED_APPS += [  # type: ignore # noqa: F405
    "whitenoise.runserver_nostatic",
]

# Database: use SQLite by default; optional MySQL or PostgreSQL if enabled
USE_MYSQL = config("USE_MYSQL", default=False, cast=bool)
USE_POSTGRES = config("USE_POSTGRES", default=False, cast=bool)

if USE_MYSQL:
    DATABASES = {  # noqa: F405
        "default": {
            "ENGINE": "django.db.backends.mysql",
            "NAME": config("DB_NAME", default="quickmeds_db"),
            "USER": config("DB_USER", default="root"),
            "PASSWORD": config("DB_PASSWORD", default=""),
            "HOST": config("DB_HOST", default="127.0.0.1"),
            "PORT": config("DB_PORT", default="3306"),
            "OPTIONS": {
                "init_command": "SET sql_mode='STRICT_TRANS_TABLES'",
                "charset": "utf8mb4",
            },
        }
    }
elif USE_POSTGRES:
    DATABASES = {  # noqa: F405
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": config("DB_NAME", default="quickmeds_db"),
            "USER": config("DB_USER", default="postgres"),
            "PASSWORD": config("DB_PASSWORD", default=""),
            "HOST": config("DB_HOST", default="127.0.0.1"),
            "PORT": config("DB_PORT", default="5432"),
        }
    }
else:
    DATABASES = {  # noqa: F405
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",  # noqa: F405
        }
    }
