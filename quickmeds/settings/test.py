from .dev import *  # noqa: F401,F403

# Override testing-specific settings here if needed
# Example: faster password hasher or email backend
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
