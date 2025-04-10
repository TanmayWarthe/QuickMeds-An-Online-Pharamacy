from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, authenticate, logout
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
@csrf_exempt
def update_profile(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=405)
    
    try:
        # Try to parse JSON data first
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            # If JSON parsing fails, use POST data
            data = request.POST
        
        user = request.user
        
        # Update user info
        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()
        phone = data.get('phone', '').strip()
        address = data.get('address', '').strip()
        city = data.get('city', '').strip()
        state = data.get('state', '').strip()
        pincode = data.get('pincode', '').strip()
        
        # Update User model fields
        if first_name:
            user.first_name = first_name
        if last_name:
            user.last_name = last_name
        user.save()
        
        # Update UserProfile fields
        profile = user.userprofile
        if phone:
            profile.phone = phone
        if address:
            profile.address = address
        if city:
            profile.city = city
        if state:
            profile.state = state
        if pincode:
            profile.pincode = pincode
        profile.save()
        
        return JsonResponse({
            'status': 'success',
            'message': 'Profile updated successfully!',
            'data': {
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'phone': profile.phone,
                'address': profile.address,
                'city': profile.city,
                'state': profile.state,
                'pincode': profile.pincode
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error updating profile: {str(e)}'
        }, status=400)

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
        user = request.user
        
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not check_password(current_password, user.password):
            return JsonResponse({
                'success': False,
                'message': 'Current password is incorrect'
            }, status=400)
        
        user.set_password(new_password)
        user.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Password updated successfully'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)

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
        # Handle both GET and POST requests
        if request.method == 'POST':
            try:
                data = json.loads(request.body)
                quantity = data.get('quantity', 1)
            except json.JSONDecodeError:
                quantity = 1
        else:
            quantity = 1
        
        # Check if product exists and is in stock
        product = Product.objects.get(id=product_id)
        if not product.in_stock:
            return JsonResponse({
                'success': False,
                'message': 'Product is out of stock'
            }, status=400)

        # Get or create cart
        cart, _ = Cart.objects.get_or_create(user=request.user)
        
        # Get or create cart item
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': quantity}
        )
        
        # If item already exists, update quantity
        if not created:
            cart_item.quantity += quantity
            cart_item.save()
        
        # Get total cart items count
        cart_count = CartItem.objects.filter(cart=cart).aggregate(
            total=Sum('quantity')
        )['total'] or 0
        
        return JsonResponse({
            'success': True,
            'message': 'Product added to cart successfully',
            'cart_count': cart_count
        })
        
    except Product.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Product not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'An error occurred while adding to cart: {str(e)}'
        }, status=500)

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
    if not request.user.is_authenticated:
        return redirect('login')
        
    cart = Cart.objects.get_or_create(user=request.user)[0]
    if not cart.cartitem_set.exists():
        messages.warning(request, 'Your cart is empty')
        return redirect('cart')
        
    # Get user's addresses
    addresses = request.user.addresses.all().order_by('-is_default', '-created_at')
        
    context = {
        'cart': cart,
        'razorpay_key_id': settings.RAZORPAY_KEY_ID,
        'addresses': addresses,
    }
    return render(request, 'checkout.html', context)

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

def create_razorpay_order(request):
    if request.method == 'POST':
        try:
            cart = Cart.objects.get(user=request.user)
            total_amount = cart.get_total() + 50  # Adding delivery fee
            
            # Create Razorpay Order
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            payment = client.order.create({
                'amount': total_amount * 100,  # Amount in paise
                'currency': 'INR',
                'payment_capture': '1'
            })
            
            return JsonResponse({
                'success': True,
                'amount': payment['amount'],
                'currency': payment['currency'],
                'order_id': payment['id']
            })
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

def process_payment(request):
    if request.method == 'POST':
        try:
            payment_id = request.POST.get('razorpay_payment_id')
            order_id = request.POST.get('razorpay_order_id')
            signature = request.POST.get('razorpay_signature')
            
            # Verify signature
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            params_dict = {
                'razorpay_payment_id': payment_id,
                'razorpay_order_id': order_id,
                'razorpay_signature': signature
            }
            
            try:
                client.utility.verify_payment_signature(params_dict)
                # Create order and clear cart
                order = create_order(request, payment_id, 'razorpay')
                return JsonResponse({'success': True, 'order_id': order.id})
            except:
                return JsonResponse({'success': False, 'error': 'Invalid signature'})
                
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

def create_order(request, transaction_id=None, payment_method='cod'):
    cart = Cart.objects.get(user=request.user)
    
    # Create order
    order = Order.objects.create(
        user=request.user,
        first_name=request.POST.get('first_name'),
        last_name=request.POST.get('last_name'),
        email=request.POST.get('email'),
        phone=request.POST.get('phone'),
        address=request.POST.get('address'),
        city=request.POST.get('city'),
        state=request.POST.get('state'),
        pincode=request.POST.get('pincode'),
        country=request.POST.get('country'),
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
def cancel_order(request, order_id):
    if request.method == 'POST':
        try:
            order = get_object_or_404(Order, id=order_id, user=request.user)
            if order.order_status in ['PENDING', 'PROCESSING']:
                order.order_status = 'CANCELLED'
                order.save()
                messages.success(request, 'Order cancelled successfully.')
                return JsonResponse({'status': 'success'})
            return JsonResponse({
                'status': 'error',
                'message': 'This order cannot be cancelled.'
            }, status=400)
        except Order.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': 'Order not found.'
            }, status=404)
    return JsonResponse({
        'status': 'error',
        'message': 'Invalid request method.'
    }, status=405)

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