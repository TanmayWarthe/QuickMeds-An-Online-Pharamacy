from django.core.mail import send_mail
from django.conf import settings
import logging
import socket
import ssl
import time
from smtplib import SMTP_SSL, SMTPException

logger = logging.getLogger(__name__)

def send_email_with_retry(subject, message, to_email, retry_count=3):
    """
    Send an email with retry mechanism and proper error handling
    """
    for attempt in range(retry_count):
        try:
            # Add delay between retries
            if attempt > 0:
                time.sleep(2 ** attempt)  # Exponential backoff
            
            # Create SSL context
            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
            
            # Send email with SSL context
            send_mail(
                subject,
                message,
                settings.EMAIL_HOST_USER,
                [to_email],
                fail_silently=False,
                connection=None,  # Let Django create a new connection
            )
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except (socket.error, ssl.SSLError, SMTPException) as e:
            logger.error(f"Attempt {attempt + 1}: SSL/Network error sending email to {to_email}: {str(e)}")
            if attempt == retry_count - 1:
                logger.error(f"Failed to send email after {retry_count} attempts")
                raise
            continue
            
        except Exception as e:
            logger.error(f"Unexpected error sending email to {to_email}: {str(e)}")
            raise

def send_otp_email(email, otp):
    """
    Send OTP email with proper formatting and error handling
    """
    subject = "Your OTP for QuickMeds Verification"
    message = f"""
Hello!

Your One-Time Password (OTP) for QuickMeds verification is: {otp}

This OTP will expire in 10 minutes.
Please do not share this OTP with anyone.

Best regards,
QuickMeds Team
    """
    
    try:
        return send_email_with_retry(subject, message, email)
    except Exception as e:
        logger.error(f"Failed to send OTP to {email}: {str(e)}")
        return False 