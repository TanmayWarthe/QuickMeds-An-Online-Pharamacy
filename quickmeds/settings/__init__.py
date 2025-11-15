import os

# Switch settings based on DJANGO_ENV (dev, prod, test). Defaults to dev.
env = os.getenv("DJANGO_ENV", "dev").lower()

if env == "prod":
    from .prod import *  # noqa: F401,F403
elif env == "test":
    from .test import *  # noqa: F401,F403
else:
    from .dev import *  # noqa: F401,F403
