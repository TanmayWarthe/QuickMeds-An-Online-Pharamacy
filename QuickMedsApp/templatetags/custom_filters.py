from django import template
from datetime import datetime, timedelta
from django.utils import timezone

register = template.Library()

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