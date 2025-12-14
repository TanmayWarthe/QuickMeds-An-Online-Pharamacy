import random
import string
import logging
import smtplib
import ssl
from email.mime.text import MIMEText
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

def generate_otp(length=4):
    """Generate a 4-digit OTP (default) or custom length"""
    return ''.join(random.choices(string.digits, k=length))

def send_otp_email(email, otp, purpose='verification'):
    """Send OTP via email"""
    if purpose == 'login':
        subject = 'QuickMeds - Your Login OTP'
        title = 'Login Verification'
        intro = 'You are attempting to log in to your QuickMeds account. Your One-Time Password (OTP) is:'
    else:
        subject = 'QuickMeds - Your Registration OTP'
        title = 'Registration Verification'
        intro = 'Thank you for registering with QuickMeds. Your One-Time Password (OTP) is:'
    
    message = f'''<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QuickMeds {title}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4f46e5; text-align: center;">QuickMeds {title}</h2>
        <p>Hello,</p>
        <p>{intro}</p>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h1 style="color: #4f46e5; margin: 0; font-size: 32px; letter-spacing: 5px;">{otp}</h1>
        </div>
        <p><strong>Important:</strong></p>
        <ul>
            <li>This OTP will expire in 10 minutes</li>
            <li>Do not share this OTP with anyone</li>
            <li>If you didn't request this OTP, please ignore this email</li>
        </ul>
        <p>Best regards,<br>QuickMeds Team</p>
    </div>
</body>
</html>'''
    
    try:
        # Log attempt
        logger.info(f"Attempting to send OTP to {email}")
        
        # Print OTP for debugging (console fallback)
        print(f"\n{'='*50}")
        print(f"OTP for {email}: {otp}")
        print(f"{'='*50}\n")
        
        # Check if email is configured
        if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
            logger.warning("Email not configured. OTP printed to console.")
            print(f"⚠️ EMAIL NOT CONFIGURED - Using console fallback")
            print(f"OTP for {email}: {otp}")
            # Return True to allow registration to continue
            return True
        
        # Create message with HTML content
        msg = MIMEText(message, 'html')
        msg['Subject'] = subject
        msg['From'] = f'QuickMeds <{settings.EMAIL_HOST_USER}>'
        msg['To'] = email
        msg['Reply-To'] = settings.EMAIL_HOST_USER
        msg['List-Unsubscribe'] = f'<mailto:{settings.EMAIL_HOST_USER}>'
        
        # Create SSL context
        context = ssl.create_default_context()
        
        # Connect to SMTP server using SSL
        with smtplib.SMTP_SSL(settings.EMAIL_HOST, settings.EMAIL_PORT, context=context) as server:
            # Login (trim spaces that Gmail app password UI shows)
            app_password = (settings.EMAIL_HOST_PASSWORD or "").replace(" ", "")
            server.login(settings.EMAIL_HOST_USER, app_password)
            
            # Send email
            server.send_message(msg)
            
            logger.info(f"Successfully sent OTP to {email}")
            print(f"✅ OTP sent successfully to {email}")
            return True
            
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP Authentication Error: {str(e)}")
        print(f"❌ SMTP Authentication Error - OTP printed to console: {otp}")
        # Return True to allow registration even if email fails
        return True
    except smtplib.SMTPException as e:
        logger.error(f"SMTP Error: {str(e)}")
        print(f"❌ SMTP Error - OTP printed to console: {otp}")
        return True
    except Exception as e:
        logger.error(f"Error sending OTP to {email}: {str(e)}")
        print(f"❌ Error sending OTP - OTP printed to console: {otp}")
        return True

def store_otp(email, otp):
    """Store OTP in cache with 10 minutes expiration"""
    try:
        cache_key = f'otp_{email}'
        cache.set(cache_key, otp, timeout=600)  # 600 seconds = 10 minutes
        logger.info(f"OTP stored in cache for {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to store OTP for {email}: {str(e)}")
        return False

def verify_otp(email, otp):
    """Verify OTP from cache"""
    try:
        cache_key = f'otp_{email}'
        stored_otp = cache.get(cache_key)
        
        # Ensure both are strings for comparison
        if stored_otp and str(stored_otp).strip() == str(otp).strip():
            cache.delete(cache_key)  # Delete OTP after successful verification
            logger.info(f"OTP verified successfully for {email}")
            return True
            
        logger.warning(f"Invalid OTP attempt for {email}. Expected: {stored_otp}, Got: {otp}")
        return False
        
    except Exception as e:
        logger.error(f"Error during OTP verification for {email}: {str(e)}")
        return False 