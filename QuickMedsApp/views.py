from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, authenticate, logout, update_session_auth_hash
from django.contrib.auth.models import User
from django.contrib import messages
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.db.models import Q, Sum
from .models import UserProfile, Address, Product, CartItem, Cart, Category, CheckoutSession, Order, OrderItem
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
import json
from random import sample
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_http_methods
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

    context = {
        'random_products': random_products,
        'cart_count': get_cart_count(request),
    }
    return render(request, 'home.html', context)

def about_view(request):
    context = {
        'cart_count': get_cart_count(request)
    }
    return render(request, 'about.html', context)

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
        return render(request, 'shop.html', context)
    except Product.DoesNotExist:
        messages.error(request, 'Product not found')
        return redirect('product')

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
                
                # Store registration data in session for later use after OTP verification
                request.session['registration_data'] = {
                    'name': name,
                    'email': email,
                    'password': password
                }
                
                # Generate and send OTP
                otp = generate_otp()
                if store_otp(email, otp) and send_otp_email(email, otp):
                    return JsonResponse({
                        'success': True,
                        'message': 'OTP sent successfully'
                    })
                else:
                    return JsonResponse({
                        'success': False,
                        'message': 'Failed to send OTP'
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
                otp = data.get('otp')
                email = data.get('email')
                
                if verify_otp(email, otp):
                    # Get registration data from session
                    registration_data = request.session.get('registration_data')
                    
                    if not registration_data:
                        return JsonResponse({
                            'success': False,
                            'message': 'Registration data not found'
                        })
                    
                    # Create user
                    user = User.objects.create_user(
                        username=registration_data['email'],
                        email=registration_data['email'],
                        password=registration_data['password'],
                        first_name=registration_data['name']
                    )
                    
                    # Log user in
                    login(request, user)
                    
                    # Clear session data
                    del request.session['registration_data']
                    
                    return JsonResponse({
                        'success': True,
                        'message': 'Registration successful',
                        'redirect_url': '/'  # Redirect to home page
                    })
                else:
                    return JsonResponse({
                        'success': False,
                        'message': 'Invalid OTP'
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
    if request.method == 'POST':
        email = request.POST.get('email')
        try:
            # Generate OTP
            otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
            
            # Store OTP in cache
            cache.set(f'otp_{email}', otp, timeout=600)  # 10 minutes timeout
            
            # Send OTP
            if send_otp_email(email, otp):
                return JsonResponse({'status': 'success', 'message': 'OTP sent successfully'})
            else:
                return JsonResponse({'status': 'error', 'message': 'Failed to send OTP'}, status=500)
                
        except Exception as e:
            logger.error(f"Error in send_otp view: {str(e)}")
            return JsonResponse({'status': 'error', 'message': 'Failed to send OTP'}, status=500)
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=400)

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

def success_view(request):
    return render(request, 'success.html')  # Create a success.html template