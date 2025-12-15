from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, authenticate, logout, update_session_auth_hash
from django.contrib.auth.models import User
from django.contrib import messages
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.db.models import Q, Sum, Count
from .models import UserProfile, Address, Product, CartItem, Cart, Category, CheckoutSession, Order, OrderItem, Contact
from django.contrib.auth.decorators import login_required, user_passes_test
from django.http import JsonResponse
import json
from random import sample
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_http_methods, require_GET
from django.contrib.auth.hashers import check_password
from django.core.files.storage import default_storage
from utils.otp import generate_otp, send_otp_email, store_otp, verify_otp
from django.conf import settings
from .payment import create_payment_order, payment_callback, place_order
import razorpay
from .razorpay_utils import create_order, verify_payment
from decouple import config
from .forms import ContactForm
from django.core.mail import send_mail
from django.utils import timezone
from django.db import transaction
import logging
from datetime import datetime

# Configure logging
logger = logging.getLogger(__name__)

# Compare this snippet from QuickMeds-Online-Pharmacy/QuickMedsApp/views.py:    

# Create your views here.
# This is the view for the base.html template
from django.shortcuts import render

def search_products(request):
    query = request.GET.get('q', '')
    
    if query:
        # Search in products
        products = Product.objects.filter(
            Q(name__icontains=query) |
            Q(description__icontains=query)
        ).select_related('category')
        
        # Get unique categories from the filtered products
        categories = Category.objects.filter(
            products__in=products
        ).distinct()
    else:
        products = Product.objects.none()
        categories = Category.objects.none()
    
    context = {
        'query': query,
        'products': products,
        'categories': categories,
        'total_results': products.count(),
        'cart_count': get_cart_count(request)
    }
    
    return render(request, 'search_results.html', context)



def shop_view(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
        if not product.image:
            product.image_url = '/static/img/medicines-icon.png'
        else:
            product.image_url = product.image.url
            
        context = {
            'product': product,
            'cart_count': get_cart_count(request),
            'is_expiring_soon': product.is_expiring_soon() if product.expiry_date else False,
        }
        return render(request, 'shop.html', context)
    except Product.DoesNotExist:
        messages.error(request, 'Product not found')
        return redirect('product')

def base(request):
    return render(request, 'base.html')


def home(request):
    products = list(Product.objects.filter(in_stock=True))  # Fetch all in-stock products
    random_products = sample(products, min(len(products), 10))  # Select up to 10 random products
    
    # Calculate stock percentage for progress bar
    for product in random_products:
        if product.stock >= 50:
            product.stock_percentage = 100
        elif product.stock >= 20:
            product.stock_percentage = 60
        else:
            product.stock_percentage = 30

    context = {
        'random_products': random_products,
        'products_count': Product.objects.filter(in_stock=True).count(),
        'cart_count': get_cart_count(request),
    }
    return render(request, 'home.html', context)

def get_cart_count(request):
    if request.user.is_authenticated:
        return CartItem.objects.filter(cart__user=request.user).count()
    return 0

def product_view(request):
    categories = Category.objects.all()
    products = Product.objects.all()
    context = {
        'categories': categories,
        'products': products
    }
    return render(request, 'product.html', context)

def product_detail_view(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
        if not product.image:
            product.image_url = '/static/img/medicines-icon.png'
        else:
            product.image_url = product.image.url
            
        context = {
            'product': product,
            'cart_count': get_cart_count(request),
            'is_expiring_soon': product.is_expiring_soon() if product.expiry_date else False,
        }
        return render(request, 'product_detail.html', context)
    except Product.DoesNotExist:
        messages.error(request, 'Product not found')
        return redirect('product')

def get_related_products(request, product_id):
    """API endpoint to get related products from the same category"""
    try:
        product = Product.objects.get(id=product_id)
        category_id = request.GET.get('category_id', product.category.id)
        
        # Get related products from the same category, excluding the current product
        related_products = Product.objects.filter(
            category_id=category_id,
            in_stock=True
        ).exclude(id=product_id).order_by('-created_at')[:8]
        
        products_data = []
        for p in related_products:
            products_data.append({
                'id': p.id,
                'name': p.name,
                'price': float(p.price),
                'original_price': float(p.original_price) if p.original_price else None,
                'discount_percentage': p.discount_percentage,
                'image_url': p.image.url if p.image else '/static/img/medicines-icon.png',
                'stock': p.stock,
                'category': p.category.name
            })
        
        return JsonResponse({
            'success': True,
            'products': products_data
        })
    except Product.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Product not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

def login_view(request):
    if request.method == 'POST':
        data = json.loads(request.body) if request.content_type == 'application/json' else request.POST
        action = data.get('action')
        email = data.get('email', '').strip()
        password = data.get('password', '')

        if action == 'register':
            try:
                # Validate email
                validate_email(email)
                
                # Check if email exists
                if User.objects.filter(email=email).exists():
                    return JsonResponse({
                        'success': False,
                        'message': 'Email already registered'
                    })
                
                # Get and validate name
                name = data.get('name', '').strip()
                if not name:
                    return JsonResponse({
                        'success': False,
                        'message': 'Name is required'
                    })
                
                # Validate password
                if len(password) < 8:
                    return JsonResponse({
                        'success': False,
                        'message': 'Password must be at least 8 characters long'
                    })
                
                # Create user immediately without OTP verification
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    password=password,
                    first_name=name
                )
                
                logger.info(f"✅ User created: {user.email}")
                
                # Log user in
                login(request, user)
                
                return JsonResponse({
                    'success': True,
                    'message': '✅ Registration successful! Welcome to QuickMeds.',
                    'redirect_url': '/'  # Redirect to home page
                })
                    
            except ValidationError:
                return JsonResponse({
                    'success': False,
                    'message': 'Please enter a valid email address'
                })
            except Exception as e:
                return JsonResponse({
                    'success': False,
                    'message': f'Registration failed: {str(e)}'
                })
                
        elif action == 'verify_otp':
            try:
                otp = data.get('otp', '').strip()
                email = data.get('email', '').strip()
                
                if not otp or not email:
                    return JsonResponse({
                        'success': False,
                        'message': '❌ OTP and email are required'
                    })
                
                logger.info(f"Verifying OTP for {email}")
                
                if verify_otp(email, otp):
                    # Get registration data from session
                    registration_data = request.session.get('registration_data')
                    
                    if not registration_data:
                        return JsonResponse({
                            'success': False,
                            'message': '❌ Session expired. Please register again.'
                        })
                    
                    # Create user
                    user = User.objects.create_user(
                        username=registration_data['email'],
                        email=registration_data['email'],
                        password=registration_data['password'],
                        first_name=registration_data['name']
                    )
                    
                    logger.info(f"✅ User created: {user.email}")
                    
                    # Log user in
                    login(request, user)
                    
                    # Clear session data
                    del request.session['registration_data']
                    
                    return JsonResponse({
                        'success': True,
                        'message': '✅ Registration successful! Welcome to QuickMeds.',
                        'redirect_url': '/'  # Redirect to home page
                    })
                else:
                    return JsonResponse({
                        'success': False,
                        'message': '❌ Invalid or expired OTP. Please try again or request a new OTP.'
                    })
                    
            except Exception as e:
                return JsonResponse({
                    'success': False,
                    'message': f'Verification failed: {str(e)}'
                })
                
        elif action == 'login':
            try:
                user = User.objects.get(email=email)
                user = authenticate(username=user.username, password=password)
                
                if user is not None:
                    # Log user in directly without OTP
                    login(request, user)
                    
                    return JsonResponse({
                        'success': True,
                        'message': f'Welcome back {user.first_name}!',
                        'redirect_url': '/'
                    })
                else:
                    return JsonResponse({
                        'success': False,
                        'message': 'Invalid password'
                    })
                    
            except User.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'message': 'No account found with this email'
                })
            except Exception as e:
                return JsonResponse({
                    'success': False,
                    'message': f'Login failed: {str(e)}'
                })
                
        elif action == 'verify_login_otp':
            try:
                otp = data.get('otp')
                email = request.session.get('login_email')
                user_id = request.session.get('login_user_id')
                
                if not email or not user_id:
                    return JsonResponse({
                        'success': False,
                        'message': 'Session expired. Please try logging in again.'
                    })
                
                if verify_otp(email, otp):
                    # Get user and log them in
                    user = User.objects.get(id=user_id)
                    login(request, user)
                    
                    # Clear session data
                    del request.session['login_user_id']
                    del request.session['login_email']
                    
                    return JsonResponse({
                        'success': True,
                        'message': f'Welcome back {user.first_name}!',
                        'redirect_url': '/'
                    })
                else:
                    return JsonResponse({
                        'success': False,
                        'message': 'Invalid OTP. Please try again.'
                    })
                    
            except Exception as e:
                return JsonResponse({
                    'success': False,
                    'message': f'Verification failed: {str(e)}'
                })
                
        elif action == 'resend_login_otp':
            try:
                email = request.session.get('login_email')
                
                if not email:
                    return JsonResponse({
                        'success': False,
                        'message': 'Session expired. Please try logging in again.'
                    })
                
                # Generate and send new OTP
                otp = generate_otp()
                store_result = store_otp(email, otp)
                email_result = send_otp_email(email, otp, purpose='login')
                
                if store_result:
                    from django.conf import settings
                    if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
                        return JsonResponse({
                            'success': True,
                            'message': f'Email not configured. Your OTP is: {otp} (Check server console)'
                        })
                    
                    return JsonResponse({
                        'success': True,
                        'message': 'New OTP sent to your email.'
                    })
                else:
                    return JsonResponse({
                        'success': False,
                        'message': 'Failed to resend OTP. Please try again.'
                    })
                    
            except Exception as e:
                return JsonResponse({
                    'success': False,
                    'message': f'Failed to resend OTP: {str(e)}'
                })
    
    return render(request, 'login.html')

def logout_view(request):
    # Get response object first
    response = redirect('home')
    
    # Clear all session data
    request.session.flush()
    
    # Perform Django logout
    logout(request)
    
    # Clear any messages
    storage = messages.get_messages(request)
    for _ in storage:
        pass  # Iterate through and clear all messages
    
    # Add logout success message
    messages.success(request, 'Logged out successfully!')
    
    # Clear all possible auth-related cookies
    response.delete_cookie('sessionid')
    response.delete_cookie('csrftoken')
    response.delete_cookie('messages')
    response.delete_cookie('django_language')
    response.delete_cookie('timezone')
    
    # Set cache control headers to prevent caching
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate, private'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'
    response['X-Frame-Options'] = 'DENY'
    response['X-Content-Type-Options'] = 'nosniff'
    
    # Clear any remaining session data
    for key in request.session.keys():
        del request.session[key]
    
    return response

@login_required
def profile_view(request):
    user = request.user
    orders = Order.objects.filter(user=user).order_by('-created_at')
    addresses = Address.objects.filter(user=user)
    
    # Calculate statistics
    orders_count = orders.count()
    addresses_count = addresses.count()
    total_spent = orders.aggregate(total=Sum('total_amount'))['total'] or 0
    
    context = {
        'user': user,
        'orders': orders,
        'addresses': addresses,
        'orders_count': orders_count,
        'addresses_count': addresses_count,
        'total_spent': total_spent,
        'recent_orders': orders[:5],  # Last 5 orders
        'orders_progress': min(orders_count * 10, 100),  # Progress bar calculation
    }
    return render(request, 'profile.html', context)

@login_required
def update_profile(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=405)
    
    try:
        # Get data from request
        data = request.POST
        user = request.user
        profile = user.userprofile
        
        # Validate required fields
        errors = {}
        
        # Validate first name
        first_name = data.get('first_name', '').strip()
        if not first_name:
            errors['first_name'] = ['First name is required']
            
        # Validate last name
        last_name = data.get('last_name', '').strip()
        if not last_name:
            errors['last_name'] = ['Last name is required']
            
        # Validate phone (if provided)
        phone = data.get('phone', '').strip()
        if phone and not phone.isdigit():
            errors['phone'] = ['Phone number must contain only digits']
        elif phone and len(phone) != 10:
            errors['phone'] = ['Phone number must be 10 digits']
            
        # If there are validation errors, return them
        if errors:
            return JsonResponse({
                'status': 'error',
                'message': 'Validation failed',
                'errors': errors
            }, status=400)
        
        # Update User model fields
        user.first_name = first_name
        user.last_name = last_name
        user.save()
        
        # Update UserProfile fields
        profile.phone = phone if phone else None
        
        # Update gender if provided
        gender = data.get('gender')
        if gender in ['M', 'F', 'O']:
            profile.gender = gender
            
        # Update date of birth if provided
        dob = data.get('dob')
        if dob:
            try:
                profile.dob = datetime.strptime(dob, '%Y-%m-%d').date()
            except ValueError:
                pass  # Ignore invalid date format
                
        profile.save()
        
        # Return success response with updated data
        return JsonResponse({
            'status': 'success',
            'message': 'Profile updated successfully!',
            'data': {
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'phone': profile.phone or '',
                'gender': profile.gender or '',
                'dob': profile.dob.strftime('%Y-%m-%d') if profile.dob else '',
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error updating profile: {str(e)}'
        }, status=500)

@login_required
@require_POST
def update_profile_image(request):
    try:
        if 'profile_image' not in request.FILES:
            return JsonResponse({
                'success': False,
                'message': 'No image file provided'
            }, status=400)

        image = request.FILES['profile_image']
        profile = request.user.userprofile

        # Delete old image if exists
        if profile.profile_image:
            default_storage.delete(profile.profile_image.path)

        profile.profile_image = image
        profile.save()

        return JsonResponse({
            'success': True,
            'message': 'Profile image updated successfully',
            'image_url': profile.profile_image.url
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)

@login_required
def add_address(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            address = Address.objects.create(
                user=request.user,
                full_name=data.get('full_name'),
                phone_number=data.get('phone_number'),
                type=data.get('type'),
                street_address=data.get('street_address'),
                city=data.get('city'),
                state=data.get('state'),
                postal_code=data.get('postal_code'),
                is_default=data.get('is_default', False)
            )
            
            if data.get('is_default'):
                # Set all other addresses as non-default
                Address.objects.filter(user=request.user).exclude(id=address.id).update(is_default=False)
            
            return JsonResponse({
                'status': 'success',
                'message': 'Address added successfully',
                'address': {
                    'id': address.id,
                    'full_name': address.full_name,
                    'type': address.type,
                    'is_default': address.is_default
                }
            })
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=400)
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=405)

@login_required
def update_address(request, address_id):
    try:
        address = Address.objects.get(id=address_id, user=request.user)
        if request.method == 'PUT':
            data = json.loads(request.body)
            address.full_name = data.get('full_name', address.full_name)
            address.phone_number = data.get('phone_number', address.phone_number)
            address.type = data.get('type', address.type)
            address.street_address = data.get('street_address', address.street_address)
            address.city = data.get('city', address.city)
            address.state = data.get('state', address.state)
            address.postal_code = data.get('postal_code', address.postal_code)
            address.is_default = data.get('is_default', address.is_default)
            
            if data.get('is_default'):
                # Set all other addresses as non-default
                Address.objects.filter(user=request.user).exclude(id=address.id).update(is_default=False)
            
            address.save()
            return JsonResponse({
                'status': 'success',
                'message': 'Address updated successfully'
            })
    except Address.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'Address not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=400)
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=405)

@login_required
def delete_address(request, address_id):
    if request.method == 'DELETE':
        try:
            address = Address.objects.get(id=address_id, user=request.user)
            address.delete()
            return JsonResponse({
                'status': 'success',
                'message': 'Address deleted successfully'
            })
        except Address.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': 'Address not found'
            }, status=404)
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=405)

@login_required
def set_default_address(request, address_id):
    if request.method == 'POST':
        try:
            address = Address.objects.get(id=address_id, user=request.user)
            # Set all addresses as non-default first
            Address.objects.filter(user=request.user).update(is_default=False)
            # Set the selected address as default
            address.is_default = True
            address.save()
            return JsonResponse({
                'status': 'success',
                'message': 'Default address updated successfully'
            })
        except Address.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': 'Address not found'
            }, status=404)
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=405)

@login_required
def get_address(request, address_id):
    try:
        address = Address.objects.get(id=address_id, user=request.user)
        return JsonResponse({
            'id': address.id,
            'full_name': address.full_name,
            'phone_number': address.phone_number,
            'type': address.type,
            'street_address': address.street_address,
            'city': address.city,
            'state': address.state,
            'postal_code': address.postal_code,
            'is_default': address.is_default
        })
    except Address.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'Address not found'
        }, status=404)

@login_required
@require_POST
def change_password(request):
    try:
        data = json.loads(request.body)
        current_password = data.get('current_password')
        new_password = data.get('new_password')

        # Validate input
        if not current_password:
            return JsonResponse({
                'success': False,
                'message': 'Current password is required',
                'field': 'current-password'
            }, status=400)

        if not new_password:
            return JsonResponse({
                'success': False,
                'message': 'New password is required',
                'field': 'new-password'
            }, status=400)

        if len(new_password) < 8:
            return JsonResponse({
                'success': False,
                'message': 'Password must be at least 8 characters long',
                'field': 'new-password'
            }, status=400)

        # Check if current password is correct
        user = request.user
        if not user.check_password(current_password):
            return JsonResponse({
                'success': False,
                'message': 'Current password is incorrect',
                'field': 'current-password'
            }, status=400)

        # Set new password
        user.set_password(new_password)
        user.save()

        # Update session to prevent logout
        update_session_auth_hash(request, user)

        return JsonResponse({
            'success': True,
            'message': 'Password updated successfully'
        })

    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid request format'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@login_required
@require_POST
def delete_account(request):
    try:
        user = request.user
        logout(request)
        user.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Account deleted successfully'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)

@login_required
@require_http_methods(["GET", "POST"])
def add_to_cart(request, product_id):
    try:
        data = json.loads(request.body) if request.body else {}
        quantity = int(data.get('quantity', 1))
        
        if quantity < 1:
            return JsonResponse({
                'success': False,
                'message': 'Quantity must be at least 1'
            }, status=400)

        product = get_object_or_404(Product, id=product_id)
        if not product.in_stock:
            return JsonResponse({
                'success': False,
                'message': 'Product is out of stock'
            }, status=400)

        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': quantity}
        )

        if not created:
            cart_item.quantity += quantity
            cart_item.save()

        cart_count = CartItem.objects.filter(cart=cart).aggregate(
            total=Sum('quantity')
        )['total'] or 0

        return JsonResponse({
            'success': True,
            'message': 'Added to cart successfully!',
            'cart_count': cart_count
        })

    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)

@login_required
def cart_view(request):
    try:
        cart = Cart.objects.get(user=request.user)
        cart_items = cart.cartitem_set.select_related('product').all()
    except Cart.DoesNotExist:
        cart_items = []
        cart = None
    
    context = {
        'cart_items': cart_items,
        'cart': cart,
        'cart_count': get_cart_count(request)
    }
    return render(request, 'cart.html', context)

@login_required
def update_cart_item(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            item_id = data.get('item_id')
            quantity = data.get('quantity')
            
            cart_item = CartItem.objects.get(
                id=item_id,
                cart__user=request.user
            )
            
            # Update quantity
            cart_item.quantity = quantity
            cart_item.save()
            
            # Get updated cart information
            cart = cart_item.cart
            cart_total = cart.get_total()
            items_count = cart.cartitem_set.count()
            
            return JsonResponse({
                'success': True,
                'message': 'Cart updated successfully',
                'cart_total': '{:,}'.format(cart_total),
                'items_count': items_count,
                'item_total': '{:,}'.format(cart_item.get_total())
            })
            
        except CartItem.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Item not found in cart'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
            
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@login_required
def remove_cart_item(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            item_id = data.get('item_id')
            
            cart_item = CartItem.objects.get(
                id=item_id,
                cart__user=request.user
            )
            
            # Get cart before deleting the item
            cart = cart_item.cart
            
            # Delete the item
            cart_item.delete()
            
            # Get updated cart information
            cart_total = cart.get_total()
            items_count = cart.cartitem_set.count()
            
            return JsonResponse({
                'success': True,
                'message': 'Item removed from cart',
                'cart_total': '{:,}'.format(cart_total),
                'items_count': items_count
            })
            
        except CartItem.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Item not found in cart'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
            
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

def showEmptyCartMessage():
    return JsonResponse({'success': False, 'error': 'Your cart is empty'})

@login_required
def checkout_view(request):
    try:
        cart = Cart.objects.get(user=request.user)
        if not cart.cartitem_set.exists():
            return redirect('cart')
        
        addresses = Address.objects.filter(user=request.user)
        
        # Get Razorpay key from settings
        razorpay_key_id = settings.RAZORPAY_KEY_ID
        
        context = {
            'cart': cart,
            'addresses': addresses,
            'RAZORPAY_KEY_ID': razorpay_key_id,
        }
        return render(request, 'checkout.html', context)
    except Cart.DoesNotExist:
        return redirect('cart')

@login_required
@require_http_methods(["GET", "POST", "PUT", "DELETE"])
def manage_address(request, address_id=None):
    if request.method == "GET":
        if address_id:
            try:
                address = Address.objects.get(id=address_id, user=request.user)
                return JsonResponse({
                    'success': True,
                    'address': {
                        'id': address.id,
                        'type': address.type,
                        'full_name': address.full_name,
                        'phone_number': address.phone_number,
                        'street_address': address.street_address,
                        'city': address.city,
                        'state': address.state,
                        'postal_code': address.postal_code,
                        'country': address.country,
                        'is_default': address.is_default
                    }
                })
            except Address.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'message': 'Address not found'
                }, status=404)
        else:
            addresses = Address.objects.filter(user=request.user)
            return JsonResponse({
                'success': True,
                'addresses': [{
                    'id': addr.id,
                    'type': addr.type,
                    'full_name': addr.full_name,
                    'phone_number': addr.phone_number,
                    'street_address': addr.street_address,
                    'city': addr.city,
                    'state': addr.state,
                    'postal_code': addr.postal_code,
                    'country': addr.country,
                    'is_default': addr.is_default
                } for addr in addresses]
            })

    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            address = Address.objects.create(
                user=request.user,
                type=data.get('type', 'Home'),
                full_name=data['full_name'],
                phone_number=data['phone_number'],
                street_address=data['street_address'],
                city=data['city'],
                state=data['state'],
                postal_code=data['postal_code'],
                country=data.get('country', 'India'),
                is_default=data.get('is_default', False)
            )
            return JsonResponse({
                'success': True,
                'message': 'Address added successfully',
                'address_id': address.id
            })
        except KeyError as e:
            return JsonResponse({
                'success': False,
                'message': f'Missing required field: {str(e)}'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': str(e)
            }, status=400)

    elif request.method == "PUT" and address_id:
        try:
            address = Address.objects.get(id=address_id, user=request.user)
            data = json.loads(request.body)
            
            # Update fields
            address.type = data.get('type', address.type)
            address.full_name = data.get('full_name', address.full_name)
            address.phone_number = data.get('phone_number', address.phone_number)
            address.street_address = data.get('street_address', address.street_address)
            address.city = data.get('city', address.city)
            address.state = data.get('state', address.state)
            address.postal_code = data.get('postal_code', address.postal_code)
            address.country = data.get('country', address.country)
            address.is_default = data.get('is_default', address.is_default)
            
            address.save()
            return JsonResponse({
                'success': True,
                'message': 'Address updated successfully'
            })
        except Address.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'Address not found'
            }, status=404)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': str(e)
            }, status=400)

    elif request.method == "DELETE" and address_id:
        try:
            address = Address.objects.get(id=address_id, user=request.user)
            address.delete()
            return JsonResponse({
                'success': True,
                'message': 'Address deleted successfully'
            })
        except Address.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'Address not found'
            }, status=404)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': str(e)
            }, status=400)

    return JsonResponse({
        'success': False,
        'message': 'Invalid request'
    }, status=400)

@login_required
@require_POST
@csrf_exempt
def create_checkout_session(request):
    try:
        data = json.loads(request.body)
        product_id = data.get('product_id')
        quantity = data.get('quantity', 1)
        buy_now = data.get('buy_now', False)

        if not product_id:
            return JsonResponse({
                'success': False, 
                'message': 'Product ID is required'
            }, status=400)

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return JsonResponse({
                'success': False, 
                'message': 'Product not found'
            }, status=404)

        if not product.in_stock:
            return JsonResponse({
                'success': False, 
                'message': 'Product is out of stock'
            }, status=400)

        if quantity < 1:
            return JsonResponse({
                'success': False, 
                'message': 'Quantity must be at least 1'
            }, status=400)

        # Check if product has stock field and validate quantity
        if hasattr(product, 'stock'):
            if quantity > product.stock:
                return JsonResponse({
                    'success': False, 
                    'message': f'Only {product.stock} items available in stock'
                }, status=400)
        else:
            # If stock field doesn't exist, just check if product is in stock
            if not product.in_stock:
                return JsonResponse({
                    'success': False, 
                    'message': 'Product is out of stock'
                }, status=400)

        # Create a new checkout session
        checkout_session = CheckoutSession.objects.create(
            user=request.user,
            product=product,
            quantity=quantity
        )

        return JsonResponse({
            'success': True,
            'session_id': checkout_session.session_id,
            'message': 'Checkout session created successfully',
            'redirect_url': f'/checkout/?session_id={checkout_session.session_id}'
        })

    except json.JSONDecodeError:
        return JsonResponse({
            'success': False, 
            'message': 'Invalid request data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False, 
            'message': f'An error occurred: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def send_otp(request):
    from .otp_utils import check_rate_limit, generate_otp, store_otp, increment_otp_count, send_otp_async
    
    try:
        data = json.loads(request.body) if request.body else request.POST
        email = data.get('email')
        
        if not email:
            return JsonResponse({'status': 'error', 'message': 'Email is required'}, status=400)
            
        # Check rate limit
        allowed, message = check_rate_limit(email)
        if not allowed:
            return JsonResponse({'status': 'error', 'message': message}, status=429)
            
        # Generate and store OTP
        otp = generate_otp()
        
        if store_otp(email, otp):
            increment_otp_count(email)
            send_otp_async(email, otp, purpose='login')
            return JsonResponse({'status': 'success', 'message': 'OTP sent successfully'})
        else:
            return JsonResponse({'status': 'error', 'message': 'Failed to generate OTP'}, status=500)
            
    except Exception as e:
        logger.error(f"Error in send_otp: {str(e)}")
        return JsonResponse({'status': 'error', 'message': 'Internal server error'}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def verify_otp_view(request):
    from .otp_utils import verify_otp
    
    try:
        data = json.loads(request.body)
        email = data.get('email')
        otp = data.get('otp')
        
        if not email or not otp:
            return JsonResponse({'success': False, 'message': 'Email and OTP are required'}, status=400)
        
        # Verify OTP
        success, message = verify_otp(email, otp)
        
        if success:
            return JsonResponse({'success': True, 'message': message})
        else:
            return JsonResponse({'success': False, 'message': message}, status=400)
            
    except Exception as e:
        logger.error(f"Error in verify_otp: {str(e)}")
        return JsonResponse({'success': False, 'message': 'Verification failed'}, status=500)

def order_confirmation_view(request, order_id):
    if not request.user.is_authenticated:
        return redirect('login')
        
    try:
        order = Order.objects.get(id=order_id, user=request.user)
        context = {
            'order': order
        }
        return render(request, 'order_confirmation.html', context)
    except Order.DoesNotExist:
        messages.error(request, 'Order not found.')
        return redirect('home')

@login_required
@require_POST
def create_razorpay_order(request):
    try:
        # Try to get user's cart or show clear error if it doesn't exist
        try:
            cart = Cart.objects.get(user=request.user)
            if not cart.cartitem_set.exists():
                return JsonResponse({
                    'success': False,
                    'error': 'Your cart is empty. Please add items to cart before checkout.'
                }, status=400)
        except Cart.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'No active cart found. Please add items to cart before checkout.'
            }, status=400)

        amount = int((cart.get_total() + 50) * 100)  # Convert to paise and add delivery fee
        
        order_data = create_order(amount)
        
        if order_data['success']:
            return JsonResponse({
                'success': True,
                'order_id': order_data['order_id'],
                'amount': order_data['amount'],
                'currency': order_data['currency']
            })
        else:
            return JsonResponse({
                'success': False,
                'error': order_data.get('error', 'Failed to create order')
            })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
@require_POST
def process_payment(request):
    try:
        payment_id = request.POST.get('razorpay_payment_id')
        order_id = request.POST.get('razorpay_order_id')
        signature = request.POST.get('razorpay_signature')
        
        # Get address data
        address_id = request.POST.get('address_id')
        if address_id:
            try:
                address = Address.objects.get(id=address_id, user=request.user)
                # Add address data to request.POST
                request.POST = request.POST.copy()
                request.POST['first_name'] = address.full_name.split()[0]
                request.POST['last_name'] = ' '.join(address.full_name.split()[1:]) if len(address.full_name.split()) > 1 else ''
                request.POST['phone'] = address.phone_number
                request.POST['address'] = address.street_address
                request.POST['city'] = address.city
                request.POST['state'] = address.state
                request.POST['pincode'] = address.postal_code
                request.POST['country'] = address.country
            except Address.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'error': 'Selected address not found'
                })
        
        if verify_payment(payment_id, order_id, signature):
            # Create the order
            order = create_user_order(request, payment_id, 'razorpay')
            if order:
                return JsonResponse({
                    'success': True,
                    'order_id': order.id
                })
        
        return JsonResponse({
            'success': False,
            'error': 'Payment verification failed'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })

def create_user_order(request, transaction_id=None, payment_method='cod'):
    try:
        cart = Cart.objects.get(user=request.user)
        
        # Get address data
        address_id = request.POST.get('address_id')
        if address_id:
            try:
                address = Address.objects.get(id=address_id, user=request.user)
                first_name = address.full_name.split()[0]
                last_name = ' '.join(address.full_name.split()[1:]) if len(address.full_name.split()) > 1 else ''
                phone = address.phone_number
                street_address = address.street_address
                city = address.city
                state = address.state
                pincode = address.postal_code
                country = address.country
            except Address.DoesNotExist:
                raise ValueError('Selected address not found')
        else:
            # Use form data
            first_name = request.POST.get('first_name')
            last_name = request.POST.get('last_name')
            phone = request.POST.get('phone')
            street_address = request.POST.get('address')
            city = request.POST.get('city')
            state = request.POST.get('state')
            pincode = request.POST.get('pincode')
            country = request.POST.get('country')
        
        # Create order
        order = Order.objects.create(
            user=request.user,
            first_name=first_name,
            last_name=last_name,
            email=request.user.email,
            phone=phone,
            address=street_address,
            city=city,
            state=state,
            pincode=pincode,
            country=country,
            total_amount=cart.get_total() + 50,  # Adding delivery fee
            payment_method=payment_method,
            transaction_id=transaction_id
        )
        
        # Create order items
        for item in cart.cartitem_set.all():
            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                price=item.product.price
            )
        
        # Clear cart
        cart.delete()
        
        return order
    except Exception as e:
        print(f"Error creating order: {str(e)}")
        return None

def process_cod_order(request):
    if request.method == 'POST':
        try:
            # Get cart
            cart = Cart.objects.get(user=request.user)
            if not cart.cartitem_set.exists():
                return JsonResponse({'success': False, 'message': 'Cart is empty'})

            # Create order
            order = Order.objects.create(
                user=request.user,
                payment_method='COD',
                payment_status='Pending',
                order_status='Placed',
                total_amount=cart.get_total() + 50,  # Adding delivery fee
                first_name=request.POST.get('first_name'),
                last_name=request.POST.get('last_name'),
                email=request.POST.get('email'),
                phone=request.POST.get('phone'),
                address=request.POST.get('address'),
                city=request.POST.get('city'),
                state=request.POST.get('state'),
                pincode=request.POST.get('pincode')
            )

            # Create order items
            for cart_item in cart.cartitem_set.all():
                OrderItem.objects.create(
                    order=order,
                    product=cart_item.product,
                    quantity=cart_item.quantity,
                    price=cart_item.product.price
                )

            # Clear cart after successful order
            cart.delete()

            return JsonResponse({
                'success': True,
                'order_id': order.id,
                'redirect_url': f'/order-confirmation/{order.id}/'
            })

        except Cart.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Cart not found'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})

    return JsonResponse({'success': False, 'message': 'Invalid request method'})

@login_required
def orders_view(request):
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    context = {
        'orders': orders,
        'orders_count': orders.count()
    }
    return render(request, 'orders.html', context)

@login_required
def order_detail(request, order_id):
    try:
        order = get_object_or_404(Order, id=order_id, user=request.user)
        print(order.first_name, order.last_name, order.address)  # Debugging line
        context = {
            'order': order,
            'order_items': order.items.all(),
            'can_cancel': order.order_status in ['PENDING', 'PROCESSING']
        }
        return render(request, 'order_detail.html', context)
    except Order.DoesNotExist:
        messages.error(request, 'Order not found.')
        return redirect('orders')

@login_required
@require_POST
def cancel_order(request, order_id):
    try:
        order = Order.objects.get(id=order_id, user=request.user)
        
        # Check if order can be cancelled
        if order.order_status in ['DELIVERED', 'CANCELLED']:
            return JsonResponse({
                'success': False,
                'message': f'Order cannot be cancelled as it is already {order.order_status.lower()}'
            })
            
        # Check if order is too old to cancel (e.g., more than 24 hours for processing orders)
        if order.order_status == 'PROCESSING' and timezone.now() > (order.created_at + timezone.timedelta(hours=24)):
            return JsonResponse({
                'success': False,
                'message': 'Order cannot be cancelled as it has been processing for more than 24 hours'
            })
            
        # Start transaction to ensure all operations are atomic
        with transaction.atomic():
            # Update order status
            order.order_status = 'CANCELLED'
            
            # Handle refund if payment was made
            if order.payment_status == 'COMPLETED':
                if order.payment_method == 'RAZORPAY':
                    try:
                        # Initialize Razorpay client
                        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
                        
                        # Initiate refund
                        refund_data = {
                            'payment_id': order.transaction_id,
                            'amount': int(float(order.total_amount) * 100),  # Amount in paisa
                            'notes': {
                                'order_id': str(order.id),
                                'reason': 'Order Cancellation'
                            }
                        }
                        refund = client.payment.refund(order.transaction_id, refund_data)
                        
                        # Update payment status
                        order.payment_status = 'REFUNDED'
                    except Exception as e:
                        # Log the error but don't stop the cancellation
                        logger.error(f"Refund failed for order {order.id}: {str(e)}")
                        # Mark for manual refund processing
                        order.payment_status = 'REFUND_PENDING'
            
            # Restore inventory
            for item in order.items.all():
                product = item.product
                product.stock += item.quantity
                product.save()
            
            order.save()
            
            # Send cancellation email to customer
            try:
                subject = f'Order #{order.id} Cancelled Successfully'
                message = f"""
                Dear {order.user.get_full_name()},
                
                Your order #{order.id} has been cancelled successfully.
                
                Order Details:
                - Order Date: {order.created_at.strftime('%B %d, %Y')}
                - Total Amount: ₹{order.total_amount}
                - Payment Status: {order.payment_status}
                
                {
                    "Refund has been initiated and will be processed within 5-7 business days." 
                    if order.payment_status in ['REFUNDED', 'REFUND_PENDING'] 
                    else ""
                }
                
                If you have any questions, please contact our support team.
                
                Thank you for shopping with QuickMeds!
                """
                
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [order.user.email],
                    fail_silently=True
                )
            except Exception as e:
                # Log the error but don't stop the process
                logger.error(f"Failed to send cancellation email for order {order.id}: {str(e)}")
        
        return JsonResponse({
            'success': True,
            'message': 'Order cancelled successfully',
            'payment_status': order.payment_status
        })
        
    except Order.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Order not found'
        }, status=404)
    except Exception as e:
        logger.error(f"Order cancellation failed for order {order_id}: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': 'Failed to cancel order. Please try again or contact support.'
        }, status=500)

from django.shortcuts import render
from .models import Product, Category
from django.contrib.auth.decorators import login_required

def product(request):
    products = Product.objects.all().order_by('-created_at')
    categories = Category.objects.all()
    
    # Filter by category if specified
    category = request.GET.get('category')
    if category:
        products = products.filter(category__name=category)
    
    # Search functionality
    search_query = request.GET.get('search')
    if search_query:
        products = products.filter(name__icontains=search_query)
    
    context = {
        'products': products,
        'categories': categories,
    }
    return render(request, 'product.html', context)

def contact_view(request):
    if request.method == 'POST':
        form = ContactForm(request.POST)
        if form.is_valid():
            try:
                # Save the contact form data
                contact = form.save()
                
                # Extract data from the form
                name = form.cleaned_data['name']
                email = form.cleaned_data['email']
                phone = form.cleaned_data['phone']
                subject = form.cleaned_data['subject']
                message = form.cleaned_data['message']

                # Prepare the email content
                email_subject = f"New Contact Form Submission: {subject}"
                email_body = f"""
                Name: {name}
                Email: {email}
                Phone: {phone}
                
                Message:
                {message}
                """

                # Send the email
                send_mail(
                    email_subject,
                    email_body,
                    settings.DEFAULT_FROM_EMAIL,
                    ['tanmaywarthe09@gmail.com'],  # Replace with your email
                    fail_silently=False,
                )

                # Check if it's an AJAX request
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({
                        'success': True,
                        'message': 'Your message has been sent successfully!'
                    })
                else:
                    messages.success(request, 'Your message has been sent successfully!')
                    return redirect('contact')

            except Exception as e:
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({
                        'success': False,
                        'message': 'Failed to send message. Please try again.'
                    }, status=500)
                else:
                    messages.error(request, 'Failed to send message. Please try again.')
                    return render(request, 'contact.html', {'form': form})
        else:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'message': 'Please correct the errors in the form.',
                    'errors': form.errors
                }, status=400)
            else:
                return render(request, 'contact.html', {'form': form})
    else:
        form = ContactForm()
        return render(request, 'contact.html', {'form': form})

@require_http_methods(["GET"])
def check_auth(request):
    """Check if user is authenticated and return user info"""
    if request.user.is_authenticated:
        return JsonResponse({
            'success': True,
            'is_authenticated': True,
            'user': {
                'id': request.user.id,
                'username': request.user.username,
                'email': request.user.email,
                'first_name': request.user.first_name,
                'last_name': request.user.last_name
            }
        })
    else:
        return JsonResponse({
            'success': True,
            'is_authenticated': False
        })

@require_http_methods(["GET"])
def get_cart_count(request):
    """Get the current cart count for the user"""
    try:
        if request.user.is_authenticated:
            cart_count = CartItem.objects.filter(cart__user=request.user).count()
        else:
            cart_count = 0
            
        return JsonResponse({
            'success': True,
            'cart_count': cart_count
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@login_required
@require_POST
def delete_order(request, order_id):
    try:
        order = Order.objects.get(id=order_id, user=request.user)
        
        # Only allow deletion of cancelled orders
        if order.order_status != 'CANCELLED':
            return JsonResponse({
                'success': False,
                'message': 'Only cancelled orders can be deleted'
            })
        
        order.delete()
        return JsonResponse({
            'success': True,
            'message': 'Order deleted successfully'
        })
        
    except Order.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Order not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': 'Failed to delete order'
        }, status=500)


# ==================== ADMIN DASHBOARD VIEWS ====================

# Admin helper function
def is_staff_or_superuser(user):
    """Check if user is staff or superuser for admin access"""
    return user.is_authenticated and (user.is_staff or user.is_superuser)

def admin_login(request):
    """Admin login view - separate from user login"""
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        
        try:
            # Get all users with this email and filter for admin users
            users_with_email = User.objects.filter(email=email, is_staff=True) | User.objects.filter(email=email, is_superuser=True)
            
            if not users_with_email.exists():
                messages.error(request, 'Invalid email or password.')
            else:
                # Try to authenticate with each user's username
                authenticated = False
                for user_obj in users_with_email:
                    user = authenticate(request, username=user_obj.username, password=password)
                    if user is not None:
                        login(request, user)
                        messages.success(request, f'Welcome back, {user.get_full_name() or user.username}!')
                        authenticated = True
                        return redirect('admin_dashboard')
                
                if not authenticated:
                    messages.error(request, 'Invalid email or password.')
                    
        except Exception as e:
            logger.error(f'Admin login error: {str(e)}')
            messages.error(request, 'An error occurred. Please try again.')
    
    # If user is already logged in and is admin, redirect to dashboard
    if request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser):
        return redirect('admin_dashboard')
    
    return render(request, 'admin_login.html')

@login_required
@user_passes_test(is_staff_or_superuser, login_url='admin_login')
def admin_dashboard(request):
    """Admin dashboard overview"""
    try:
        total_products = Product.objects.count()
        total_orders = Order.objects.count()
        pending_orders = Order.objects.filter(order_status='PENDING').count()
        total_users = User.objects.count()
        
        recent_orders = Order.objects.select_related('user').order_by('-created_at')[:10]
        low_stock_products = Product.objects.filter(stock__lte=10).order_by('stock')[:10]
        
        # Calculate total revenue
        total_revenue = Order.objects.filter(
            payment_status='COMPLETED'
        ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        context = {
            'total_products': total_products,
            'total_orders': total_orders,
            'pending_orders': pending_orders,
            'total_users': total_users,
            'recent_orders': recent_orders,
            'low_stock_products': low_stock_products,
            'total_revenue': total_revenue,
        }
        return render(request, 'admin_dashboard.html', context)
    except Exception as e:
        logger.error(f'Admin dashboard error: {str(e)}')
        messages.error(request, 'Error loading dashboard. Please try again.')
        return render(request, 'admin_dashboard.html', {})

@login_required
@user_passes_test(is_staff_or_superuser, login_url='admin_login')
def admin_products(request):
    """Manage products"""
    try:
        products = Product.objects.select_related('category').all()
        categories = Category.objects.all()
        
        # Filtering
        search = request.GET.get('search', '').strip()
        category = request.GET.get('category', '').strip()
        stock_status = request.GET.get('stock_status', '').strip()
        
        if search:
            products = products.filter(Q(name__icontains=search) | Q(description__icontains=search))
        
        if category:
            products = products.filter(category_id=category)
        
        if stock_status == 'in_stock':
            products = products.filter(in_stock=True, stock__gt=0)
        elif stock_status == 'out_of_stock':
            products = products.filter(Q(in_stock=False) | Q(stock=0))
        elif stock_status == 'low_stock':
            products = products.filter(stock__lte=10, stock__gt=0)
        
        context = {
            'products': products,
            'categories': categories,
            'search': search,
            'selected_category': category,
            'selected_stock_status': stock_status,
        }
        return render(request, 'admin_products.html', context)
    except Exception as e:
        logger.error(f'Admin products error: {str(e)}')
        messages.error(request, 'Error loading products. Please try again.')
        return redirect('admin_dashboard')

@login_required
@user_passes_test(is_staff_or_superuser, login_url='admin_login')
def admin_orders(request):
    """Manage orders"""
    try:
        orders = Order.objects.select_related('user').prefetch_related('items__product').order_by('-created_at')
        
        # Filtering
        status = request.GET.get('status', '').strip()
        payment_status = request.GET.get('payment_status', '').strip()
        search = request.GET.get('search', '').strip()
        
        if status:
            orders = orders.filter(order_status=status)
        
        if payment_status:
            orders = orders.filter(payment_status=payment_status)
        
        if search:
            orders = orders.filter(
                Q(id__icontains=search) |
                Q(user__email__icontains=search) |
                Q(user__username__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        context = {
            'orders': orders,
            'selected_status': status,
            'selected_payment_status': payment_status,
            'search': search,
            'order_status_choices': Order.ORDER_STATUS_CHOICES,
            'payment_status_choices': Order.PAYMENT_STATUS_CHOICES,
        }
        return render(request, 'admin_orders.html', context)
    except Exception as e:
        logger.error(f'Admin orders error: {str(e)}')
        messages.error(request, 'Error loading orders. Please try again.')
        return redirect('admin_dashboard')

@login_required
@user_passes_test(is_staff_or_superuser, login_url='admin_login')
def admin_users(request):
    """Manage users"""
    users = User.objects.select_related('userprofile').all().order_by('-date_joined')
    staff_count = User.objects.filter(is_staff=True).count()
    active_count = User.objects.filter(is_active=True).count()
    
    # Filter by status if specified
    status = request.GET.get('status')
    if status == 'active':
        users = users.filter(is_active=True)
    elif status == 'inactive':
        users = users.filter(is_active=False)
    elif status == 'staff':
        users = users.filter(is_staff=True)
    
    # Search functionality
    search = request.GET.get('search')
    if search:
        users = users.filter(
            Q(username__icontains=search) |
            Q(email__icontains=search) |
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search)
        )
    
    context = {
        'users': users,
        'staff_count': staff_count,
        'active_count': active_count,
        'total_count': User.objects.count(),
    }
    return render(request, 'admin_users.html', context)

@login_required
@user_passes_test(is_staff_or_superuser, login_url='admin_login')
@require_POST
def admin_user_toggle_status(request, user_id):
    """Toggle user active status"""
    user = get_object_or_404(User, id=user_id)
    
    # Prevent self-deactivation
    if user == request.user:
        messages.error(request, 'You cannot deactivate your own account!')
        return redirect('admin_users')
    
    # Prevent deactivating superusers (unless current user is superuser)
    if user.is_superuser and not request.user.is_superuser:
        messages.error(request, 'You cannot deactivate a superuser!')
        return redirect('admin_users')
    
    try:
        user.is_active = not user.is_active
        user.save()
        status = 'activated' if user.is_active else 'deactivated'
        messages.success(request, f'User "{user.username}" {status} successfully!')
    except Exception as e:
        messages.error(request, f'Error updating user: {str(e)}')
    
    return redirect('admin_users')

@login_required
@user_passes_test(is_staff_or_superuser, login_url='admin_login')
@require_POST
def admin_user_delete(request, user_id):
    """Delete user"""
    user = get_object_or_404(User, id=user_id)
    
    # Prevent self-deletion
    if user == request.user:
        messages.error(request, 'You cannot delete your own account!')
        return redirect('admin_users')
    
    # Prevent deleting superusers (unless current user is superuser)
    if user.is_superuser and not request.user.is_superuser:
        messages.error(request, 'You cannot delete a superuser!')
        return redirect('admin_users')
    
    try:
        username = user.username
        user.delete()
        messages.success(request, f'User "{username}" deleted successfully!')
    except Exception as e:
        messages.error(request, f'Error deleting user: {str(e)}')
    
    return redirect('admin_users')

@login_required
@user_passes_test(is_staff_or_superuser, login_url='admin_login')
@require_POST
def admin_logout(request):
    """Admin logout"""
    try:
        logout(request)
        messages.success(request, 'Logged out successfully!')
    except Exception as e:
        logger.error(f'Admin logout error: {str(e)}')
    return redirect('admin_login')

@login_required
@user_passes_test(is_staff_or_superuser, login_url='admin_login')
def admin_categories(request):
    """Manage categories"""
    try:
        categories = Category.objects.annotate(
            products_count=Count('products')
        ).order_by('name')
        
        # Search functionality
        search = request.GET.get('search', '').strip()
        if search:
            categories = categories.filter(Q(name__icontains=search) | Q(description__icontains=search))
        
        context = {
            'categories': categories,
            'search': search,
        }
        return render(request, 'admin_categories.html', context)
    except Exception as e:
        logger.error(f'Admin categories error: {str(e)}')
        messages.error(request, 'Error loading categories. Please try again.')
        return redirect('admin_dashboard')

@login_required
@user_passes_test(is_staff_or_superuser, login_url='admin_login')
def admin_category_add(request):
    """Add new category"""
    from .forms import CategoryAdminForm
    
    if request.method == 'POST':
        form = CategoryAdminForm(request.POST, request.FILES)
        if form.is_valid():
            try:
                category = form.save()
                messages.success(request, f'Category "{category.name}" added successfully!')
                return redirect('admin_categories')
            except Exception as e:
                logger.error(f'Error adding category: {str(e)}')
                messages.error(request, f'Error adding category: {str(e)}')
        else:
            # Show specific field errors
            for field, errors in form.errors.items():
                field_label = form.fields[field].label if field in form.fields else field
                for error in errors:
                    messages.error(request, f'{field_label}: {error}')
    else:
        form = CategoryAdminForm()
    
    context = {
        'form': form,
        'title': 'Add New Category',
        'button_text': 'Add Category'
    }
    return render(request, 'admin_category_form.html', context)

@login_required
@user_passes_test(is_staff_or_superuser, login_url='admin_login')
def admin_category_edit(request, category_id):
    """Edit category"""
    from .forms import CategoryAdminForm
    
    category = get_object_or_404(Category, id=category_id)
    
    if request.method == 'POST':
        form = CategoryAdminForm(request.POST, request.FILES, instance=category)
        if form.is_valid():
            try:
                category = form.save()
                messages.success(request, f'Category "{category.name}" updated successfully!')
                return redirect('admin_categories')
            except Exception as e:
                logger.error(f'Error updating category: {str(e)}')
                messages.error(request, f'Error updating category: {str(e)}')
        else:
            # Show specific field errors
            for field, errors in form.errors.items():
                field_label = form.fields[field].label if field in form.fields else field
                for error in errors:
                    messages.error(request, f'{field_label}: {error}')
    else:
        form = CategoryAdminForm(instance=category)
    
    context = {
        'form': form,
        'category': category,
        'title': 'Edit Category',
        'button_text': 'Update Category'
    }
    return render(request, 'admin_category_form.html', context)

@login_required
@user_passes_test(is_staff_or_superuser, login_url='admin_login')
@require_POST
def admin_category_delete(request, category_id):
    """Delete category"""
    category = get_object_or_404(Category, id=category_id)
    category_name = category.name
    
    try:
        # Check if category has products
        products_count = category.products.count()
        if products_count > 0:
            messages.error(request, f'Cannot delete category "{category_name}" because it has {products_count} product(s). Please reassign or delete those products first.')
            return redirect('admin_categories')
        
        category.delete()
        messages.success(request, f'Category "{category_name}" deleted successfully!')
    except Exception as e:
        logger.error(f'Error deleting category: {str(e)}')
        messages.error(request, f'Error deleting category: {str(e)}')
    
    return redirect('admin_categories')

@login_required
@user_passes_test(is_staff_or_superuser, login_url='admin_login')
def admin_contacts(request):
    """View contact messages"""
    try:
        contacts = Contact.objects.all().order_by('-created_at')
        
        # Filter by read status if specified
        read_status = request.GET.get('status', '').strip()
        search = request.GET.get('search', '').strip()
        
        if read_status == 'read':
            contacts = contacts.filter(is_read=True)
        elif read_status == 'unread':
            contacts = contacts.filter(is_read=False)
        
        if search:
            contacts = contacts.filter(
                Q(name__icontains=search) |
                Q(email__icontains=search) |
                Q(subject__icontains=search) |
                Q(message__icontains=search)
            )
        
        unread_count = Contact.objects.filter(is_read=False).count()
        
        context = {
            'contacts': contacts,
            'unread_count': unread_count,
            'selected_status': read_status,
            'search': search,
        }
        return render(request, 'admin_contacts.html', context)
    except Exception as e:
        logger.error(f'Admin contacts error: {str(e)}')
        messages.error(request, 'Error loading contacts. Please try again.')
        return redirect('admin_dashboard')

@login_required
@user_passes_test(is_staff_or_superuser, login_url='admin_login')
@require_POST
def admin_contact_delete(request, contact_id):
    """Delete contact message"""
    contact = get_object_or_404(Contact, id=contact_id)
    
    try:
        contact_name = contact.name
        contact.delete()
        messages.success(request, f'Contact message from "{contact_name}" deleted successfully!')
    except Exception as e:
        logger.error(f'Error deleting contact: {str(e)}')
        messages.error(request, f'Error deleting contact: {str(e)}')
    
    return redirect('admin_contacts')

@login_required
@user_passes_test(is_staff_or_superuser, login_url='admin_login')
@require_POST
def admin_contact_mark_read(request, contact_id):
    """Mark contact as read/unread"""
    contact = get_object_or_404(Contact, id=contact_id)
    
    try:
        contact.is_read = not contact.is_read
        contact.save()
        status = 'read' if contact.is_read else 'unread'
        messages.success(request, f'Contact message marked as {status}!')
    except Exception as e:
        logger.error(f'Error updating contact: {str(e)}')
        messages.error(request, f'Error updating contact: {str(e)}')
    
    return redirect('admin_contacts')

@login_required
@user_passes_test(is_staff_or_superuser, login_url='admin_login')
def admin_product_add(request):
    """Add new product"""
    from .forms import ProductAdminForm
    
    if request.method == 'POST':
        form = ProductAdminForm(request.POST, request.FILES)
        if form.is_valid():
            try:
                product = form.save()
                messages.success(request, f'Product "{product.name}" added successfully!')
                return redirect('admin_products')
            except Exception as e:
                logger.error(f'Error adding product: {str(e)}')
                messages.error(request, f'Error adding product: {str(e)}')
        else:
            # Show specific field errors
            for field, errors in form.errors.items():
                field_label = form.fields[field].label if field in form.fields else field
                for error in errors:
                    messages.error(request, f'{field_label}: {error}')
    else:
        form = ProductAdminForm()
    
    context = {
        'form': form,
        'title': 'Add New Product',
        'button_text': 'Add Product'
    }
    return render(request, 'admin_product_form.html', context)

@login_required
@user_passes_test(is_staff_or_superuser, login_url='admin_login')
def admin_product_edit(request, product_id):
    """Edit product"""
    from .forms import ProductAdminForm
    
    product = get_object_or_404(Product, id=product_id)
    
    if request.method == 'POST':
        form = ProductAdminForm(request.POST, request.FILES, instance=product)
        if form.is_valid():
            try:
                product = form.save()
                messages.success(request, f'Product "{product.name}" updated successfully!')
                return redirect('admin_products')
            except Exception as e:
                logger.error(f'Error updating product: {str(e)}')
                messages.error(request, f'Error updating product: {str(e)}')
        else:
            # Show specific field errors
            for field, errors in form.errors.items():
                field_label = form.fields[field].label if field in form.fields else field
                for error in errors:
                    messages.error(request, f'{field_label}: {error}')
    else:
        form = ProductAdminForm(instance=product)
    
    context = {
        'form': form,
        'product': product,
        'title': 'Edit Product',
        'button_text': 'Update Product'
    }
    return render(request, 'admin_product_form.html', context)

@login_required
@user_passes_test(is_staff_or_superuser, login_url='admin_login')
@require_POST
def admin_product_delete(request, product_id):
    """Delete product"""
    product = get_object_or_404(Product, id=product_id)
    product_name = product.name
    
    try:
        # Check if product is in any pending orders
        pending_orders = OrderItem.objects.filter(
            product=product,
            order__order_status__in=['PENDING', 'PROCESSING']
        ).exists()
        
        if pending_orders:
            messages.error(request, f'Cannot delete "{product_name}" - it has pending orders. Mark it as out of stock instead.')
            return redirect('admin_products')
        
        product.delete()
        messages.success(request, f'Product "{product_name}" deleted successfully!')
    except Exception as e:
        logger.error(f'Error deleting product: {str(e)}')
        messages.error(request, f'Error deleting product: {str(e)}')
    
    return redirect('admin_products')


# ==========================
# OTP TESTING VIEWS (Development only)
# ==========================

@login_required
@user_passes_test(is_staff_or_superuser, login_url='admin_login')
def test_otp_page(request):
    """OTP testing page - Admin only"""
    if not settings.DEBUG:
        messages.error(request, 'This feature is only available in development mode.')
        return redirect('admin_dashboard')
    return render(request, 'test_otp.html')

@login_required
@user_passes_test(is_staff_or_superuser, login_url='admin_login')
@csrf_exempt
def test_otp_api(request):
    """API for OTP testing - Admin only"""
    # Disable in production
    if not settings.DEBUG:
        return JsonResponse({
            'success': False,
            'message': 'This feature is only available in development mode.'
        })
    
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'POST method required'})
    
    try:
        data = json.loads(request.body)
        action = data.get('action')
        email = data.get('email', '').strip()
        
        if action == 'generate':
            # Generate and store OTP
            otp = generate_otp()
            store_result = store_otp(email, otp)
            
            if not store_result:
                return JsonResponse({
                    'success': False,
                    'message': 'Failed to store OTP. Check cache configuration.'
                })
            
            # Try to send email
            email_result = send_otp_email(email, otp, 'verification')
            
            # Check if email is configured
            from django.conf import settings
            if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
                return JsonResponse({
                    'success': True,
                    'message': 'OTP generated (Email not configured - check console)',
                    'otp': otp,  # Show OTP in response
                    'email_configured': False
                })
            
            return JsonResponse({
                'success': True,
                'message': 'OTP sent to email successfully!',
                'email_configured': True
            })
            
        elif action == 'verify':
            otp = data.get('otp', '').strip()
            
            if not otp:
                return JsonResponse({
                    'success': False,
                    'message': 'OTP is required'
                })
            
            if verify_otp(email, otp):
                return JsonResponse({
                    'success': True,
                    'message': 'OTP verified successfully!'
                })
            else:
                return JsonResponse({
                    'success': False,
                    'message': 'Invalid or expired OTP'
                })
        else:
            return JsonResponse({
                'success': False,
                'message': 'Invalid action'
            })
            
    except Exception as e:
        logger.error(f"Test OTP API error: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        })

@login_required
@user_passes_test(is_staff_or_superuser, login_url='admin_login')
def admin_order_detail(request, order_id):
    """View order details"""
    try:
        order = get_object_or_404(Order.objects.select_related('user').prefetch_related('items__product'), id=order_id)
        
        context = {
            'order': order,
            'order_status_choices': Order.ORDER_STATUS_CHOICES,
            'payment_status_choices': Order.PAYMENT_STATUS_CHOICES,
        }
        return render(request, 'admin_order_detail.html', context)
    except Exception as e:
        logger.error(f'Error loading order detail: {str(e)}')
        messages.error(request, 'Error loading order details. Please try again.')
        return redirect('admin_orders')

@login_required
@user_passes_test(is_staff_or_superuser, login_url='admin_login')
@require_POST
def admin_order_update_status(request, order_id):
    """Update order status"""
    order = get_object_or_404(Order, id=order_id)
    
    new_order_status = request.POST.get('order_status')
    new_payment_status = request.POST.get('payment_status')
    
    try:
        updated = False
        
        if new_order_status and new_order_status != order.order_status:
            order.order_status = new_order_status
            updated = True
        
        if new_payment_status and new_payment_status != order.payment_status:
            order.payment_status = new_payment_status
            updated = True
        
        if updated:
            order.save()
            messages.success(request, f'Order #{order.id} status updated successfully!')
            
            # Send email notification to customer
            try:
                subject = f'Order #{order.id} Status Update'
                message = f"""
                Dear {order.user.get_full_name() or order.user.username},
                
                Your order #{order.id} status has been updated.
                
                Order Status: {order.get_order_status_display()}
                Payment Status: {order.get_payment_status_display()}
                
                Order Details:
                - Total Amount: ₹{order.total_amount}
                - Order Date: {order.created_at.strftime('%B %d, %Y')}
                
                Thank you for shopping with QuickMeds!
                """
                
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [order.user.email],
                    fail_silently=True
                )
            except Exception as e:
                logger.error(f"Failed to send order update email: {str(e)}")
        else:
            messages.info(request, 'No changes were made.')
            
    except Exception as e:
        messages.error(request, f'Error updating order: {str(e)}')
    
    return redirect('admin_order_detail', order_id=order.id)

def success_view(request):
    return render(request, 'success.html')  # Create a success.html template