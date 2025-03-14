from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.models import User
from django.contrib import messages
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from .models import UserProfile, Address
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from .models import Product, CartItem, Cart, Category
from django.db.models import Q
import json
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_http_methods
from django.contrib.auth.hashers import check_password
from django.core.files.storage import default_storage

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
    # Get 12 random products that are in stock
    random_products = Product.objects.filter(in_stock=True).order_by('?')[:12]
    
    context = {
        'random_products': random_products,
        'cart_count': get_cart_count(request)
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
        action = request.POST.get('action')
        email = request.POST.get('email', '').strip()
        password = request.POST.get('password', '')

        if action == 'register':
            try:
                # Validate email
                validate_email(email)
                
                # Check if email exists
                if User.objects.filter(email=email).exists():
                    messages.error(request, 'Email already registered')
                    return redirect('login')
                
                # Get and validate name
                name = request.POST.get('name', '').strip()
                if not name:
                    messages.error(request, 'Name is required')
                    return redirect('login')
                
                # Validate password
                if len(password) < 8:
                    messages.error(request, 'Password must be at least 8 characters long')
                    return redirect('login')
                
                # Create user
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    password=password,
                    first_name=name
                )
                
                # Create user profile
                UserProfile.objects.create(user=user)
                
                # Log user in
                login(request, user)
                messages.success(request, f'Welcome {name}! Your account has been created successfully.')
                return redirect('home')
                
            except ValidationError:
                messages.error(request, 'Please enter a valid email address')
            except Exception as e:
                messages.error(request, 'Registration failed. Please try again.')
            
        elif action == 'login':
            try:
                user = User.objects.get(email=email)
                user = authenticate(username=user.username, password=password)
                
                if user is not None:
                    login(request, user)
                    messages.success(request, f'Welcome back {user.first_name}!')
                    return redirect('home')
                else:
                    messages.error(request, 'Invalid password')
                    
            except User.DoesNotExist:
                messages.error(request, 'No account found with this email')
            except Exception as e:
                messages.error(request, 'Login failed. Please try again.')
        
        return redirect('login')
    
    return render(request, 'login.html')

def logout_view(request):
    logout(request)
    messages.success(request, 'Logged out successfully!')
    return redirect('home')

@login_required
def profile_view(request):
    user = request.user
    addresses = Address.objects.filter(user=user)
    orders = user.orders.all().order_by('-created_at')[:5] if hasattr(user, 'orders') else []
    addresses_count = addresses.count()
    orders_count = user.orders.count() if hasattr(user, 'orders') else 0

    context = {
        'user': user,
        'addresses': addresses,
        'orders': orders,
        'recent_orders': orders[:3],
        'addresses_count': addresses_count,
        'orders_count': orders_count,
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
@require_POST
def add_address(request):
    try:
        data = json.loads(request.body)
        address = Address.objects.create(
            user=request.user,
            address_type=data.get('address_type'),
            full_name=data.get('full_name'),
            phone_number=data.get('phone_number'),
            address=data.get('address'),
            city=data.get('city'),
            state=data.get('state'),
            pincode=data.get('pincode'),
            is_default=data.get('is_default', False)
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Address added successfully',
            'address': {
                'id': address.id,
                'address_type': address.address_type,
                'full_name': address.full_name,
                'address': address.address,
                'city': address.city,
                'state': address.state,
                'pincode': address.pincode
            }
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)

@login_required
@require_POST
def update_address(request, address_id):
    try:
        address = Address.objects.get(id=address_id, user=request.user)
        data = json.loads(request.body)
        
        address.address_type = data.get('address_type', address.address_type)
        address.full_name = data.get('full_name', address.full_name)
        address.phone_number = data.get('phone_number', address.phone_number)
        address.address = data.get('address', address.address)
        address.city = data.get('city', address.city)
        address.state = data.get('state', address.state)
        address.pincode = data.get('pincode', address.pincode)
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

@login_required
@require_POST
def delete_address(request, address_id):
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
def add_to_cart(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            product_id = data.get('product_id')
            quantity = data.get('quantity', 1)
            
            # Get or create cart for user
            cart, created = Cart.objects.get_or_create(user=request.user)
            
            # Get or create cart item
            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                product_id=product_id,
                defaults={'quantity': quantity}
            )
            
            if not created:
                cart_item.quantity += quantity
                cart_item.save()
            
            # Get updated cart information
            cart_total = cart.get_total()
            items_count = cart.cartitem_set.count()
            
            return JsonResponse({
                'success': True,
                'message': 'Item added to cart successfully',
                'cart_total': '{:,}'.format(cart_total),
                'items_count': items_count
            })
            
        except Product.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Product not found'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
            
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

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
                'item_total': '{:,}'.format(cart_item.get_total_price())
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
        cart_items = cart.cartitem_set.select_related('product').all()
        
        if not cart_items:
            messages.warning(request, 'Your cart is empty. Please add items to your cart before proceeding to checkout.')
            return redirect('cart')
        
    except Cart.DoesNotExist:
        messages.warning(request, 'Your cart is empty. Please add items to your cart before proceeding to checkout.')
        return redirect('cart')
    
    context = {
        'cart_items': cart_items,
        'cart': cart,
        'cart_count': get_cart_count(request)
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
