import random
import string
from django.core.mail import send_mail
from django.core.cache import cache
from django.conf import settings

def generate_otp(length=6):
    """Generate a random OTP of specified length"""
    return ''.join(random.choices(string.digits, k=length))

def store_otp(email, otp, timeout=300):
    """Store OTP in cache with 5 minutes expiry"""
    try:
        cache_key = f'otp_{email}'
        cache.set(cache_key, otp, timeout)
        return True
    except Exception:
        return False

def verify_otp(email, otp):
    """Verify the OTP for given email"""
    try:
        cache_key = f'otp_{email}'
        stored_otp = cache.get(cache_key)
        if stored_otp and str(stored_otp) == str(otp):
            cache.delete(cache_key)  # Delete OTP after successful verification
            return True
        return False
    except Exception:
        return False

def send_otp_email(email, otp):
    """Send OTP via email"""
    try:
        subject = 'Your QuickMeds Verification Code'
        message = f'Your verification code is: {otp}\nValid for 5 minutes.'
        from_email = settings.EMAIL_HOST_USER
        recipient_list = [email]
        
        send_mail(
            subject,
            message,
            from_email,
            recipient_list,
            fail_silently=False,
        )
        return True
    except Exception:
        return False