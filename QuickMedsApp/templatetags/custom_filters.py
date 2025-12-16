from django import template
from datetime import datetime, timedelta
from django.utils import timezone
from django.utils.safestring import mark_safe
import logging

register = template.Library()
logger = logging.getLogger(__name__)

@register.filter
def add_days(value, days):
    try:
        if not value:
            return ''
        
        # If value is already a datetime object, use it directly
        if isinstance(value, datetime):
            result_date = value + timedelta(days=int(days))
        # If value is a string, try to parse it
        elif isinstance(value, str):
            try:
                value = datetime.strptime(value, "%d %b %Y")
                result_date = value + timedelta(days=int(days))
            except ValueError:
                # If the first format fails, try an alternative format
                value = datetime.strptime(value, "%Y-%m-%d")
                result_date = value + timedelta(days=int(days))
        else:
            return value
            
        # Format the result date
        return result_date.strftime("%d %b %Y")
    except (ValueError, TypeError):
        return value


@register.simple_tag
def safe_cloudinary(image_field, width=None, height=None, crop="fit", **kwargs):
    """
    Safely render a Cloudinary image with fallback.
    If Cloudinary is not configured or fails, returns a placeholder.
    
    Usage:
        {% safe_cloudinary product.image width=50 height=50 crop="fill" %}
    """
    try:
        if not image_field:
            return mark_safe(
                f'<div style="width: {width or 100}px; height: {height or 100}px; '
                f'background: linear-gradient(135deg, #e2e8f0, #cbd5e1); '
                f'border-radius: 8px; display: flex; align-items: center; '
                f'justify-content: center;"><i class="fas fa-image" '
                f'style="color: #94a3b8;"></i></div>'
            )
        
        # Import here to avoid circular imports
        from cloudinary import CloudinaryImage
        from django.conf import settings
        
        # Check if Cloudinary is configured
        if not hasattr(settings, 'CLOUDINARY_STORAGE') or not settings.CLOUDINARY_STORAGE:
            logger.warning("Cloudinary not configured, using fallback")
            return mark_safe(
                f'<div style="width: {width or 100}px; height: {height or 100}px; '
                f'background: linear-gradient(135deg, #fef3c7, #fde68a); '
                f'border-radius: 8px; display: flex; align-items: center; '
                f'justify-content: center;"><i class="fas fa-exclamation-triangle" '
                f'style="color: #f59e0b;"></i></div>'
            )
        
        # Build transformation options
        transformation = {}
        if width:
            transformation['width'] = width
        if height:
            transformation['height'] = height
        if crop:
            transformation['crop'] = crop
        
        # Merge additional kwargs
        transformation.update(kwargs)
        
        # Get the public_id
        public_id = image_field.public_id if hasattr(image_field, 'public_id') else str(image_field)
        
        # Generate the image URL
        image_url = CloudinaryImage(public_id).build_url(**transformation)
        
        # Return an img tag
        return mark_safe(
            f'<img src="{image_url}" width="{width}" height="{height}" '
            f'style="object-fit: cover;" loading="lazy" />'
        )
        
    except Exception as e:
        logger.error(f"Error rendering Cloudinary image: {str(e)}")
        return mark_safe(
            f'<div style="width: {width or 100}px; height: {height or 100}px; '
            f'background: linear-gradient(135deg, #fecaca, #fca5a5); '
            f'border-radius: 8px; display: flex; align-items: center; '
            f'justify-content: center;"><i class="fas fa-exclamation-circle" '
            f'style="color: #dc2626;"></i></div>'
        )
 