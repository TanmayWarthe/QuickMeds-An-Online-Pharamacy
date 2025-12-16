from django.apps import AppConfig


class QuickmedsappConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'QuickMedsApp'
    
    def ready(self):
        """
        Configure Cloudinary when the app is ready.
        This ensures Cloudinary is configured after Django setup.
        """
        import cloudinary
        from django.conf import settings
        
        # Only configure if CLOUDINARY_STORAGE is set
        if hasattr(settings, 'CLOUDINARY_STORAGE') and settings.CLOUDINARY_STORAGE:
            try:
                cloudinary.config(
                    cloud_name=settings.CLOUDINARY_STORAGE.get('CLOUD_NAME'),
                    api_key=settings.CLOUDINARY_STORAGE.get('API_KEY'),
                    api_secret=settings.CLOUDINARY_STORAGE.get('API_SECRET'),
                    secure=True
                )
                
                # Verify it worked
                config = cloudinary.config()
                if config.cloud_name:
                    import sys
                    sys.stderr.write(f"✅ Cloudinary SDK configured in app ready: {config.cloud_name}\n")
                    sys.stderr.flush()
            except Exception as e:
                import sys
                sys.stderr.write(f"⚠️  Cloudinary config in app ready failed: {str(e)}\n")
                sys.stderr.flush()



