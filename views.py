from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json
from .utils.otp import generate_otp, send_otp_email, store_otp, verify_otp

def home(request):
    return render(request, 'home.html')

def login_view(request):
    return render(request, 'login.html')

@csrf_exempt
@require_http_methods(["POST"])
def send_otp(request):
    try:
        data = json.loads(request.body)
        email = data.get('email')
        
        if not email:
            return JsonResponse({
                'success': False,
                'message': 'Email is required'
            }, status=400)
        
        # Generate OTP
        otp = generate_otp()
        
        # Store OTP
        if not store_otp(email, otp):
            return JsonResponse({
                'success': False,
                'message': 'Failed to store OTP'
            }, status=500)
        
        # Send OTP via email
        if send_otp_email(email, otp):
            return JsonResponse({
                'success': True,
                'message': 'OTP sent successfully'
            })
        else:
            return JsonResponse({
                'success': False,
                'message': 'Failed to send OTP'
            }, status=500)
            
    except Exception as e:
        print(f"Error in send_otp view: {str(e)}")  # Debug print
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def verify_otp_view(request):
    try:
        data = json.loads(request.body)
        email = data.get('email')
        otp = data.get('otp')
        
        if not email or not otp:
            return JsonResponse({
                'success': False,
                'message': 'Email and OTP are required'
            }, status=400)
        
        # Verify OTP
        if verify_otp(email, otp):
            return JsonResponse({
                'success': True,
                'message': 'OTP verified successfully'
            })
        else:
            return JsonResponse({
                'success': False,
                'message': 'Invalid or expired OTP'
            }, status=400)
            
    except Exception as e:
        print(f"Error in verify_otp view: {str(e)}")  # Debug print
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500) 