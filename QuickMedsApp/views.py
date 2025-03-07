from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.models import User
from django.contrib import messages
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from .models import UserProfile
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from .models import Product, CartItem, Cart, Category
from django.db.models import Q
import json
from django.views.decorators.csrf import csrf_exempt

# Compare this snippet from QuickMeds-Online-Pharmacy/QuickMedsApp/views.py:    

# Create your views here.
# This is the view for the base.html template
from django.shortcuts import render

def search_products(request):
    query = request.GET.get('q', '')
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
    
    if is_ajax:
        suggestions = []
        if query:
            products = Product.objects.filter(
                Q(name__icontains=query) |
                Q(category__name__icontains=query) |
                Q(description__icontains=query)
            ).distinct()[:5]
            
            categories = Category.objects.filter(name__icontains=query)[:3]
            
            for product in products:
                suggestions.append({
                    'type': 'product',
                    'id': product.id,
                    'name': product.name,
                    'category': product.category.name,
                    'price': str(product.price),
                    'image_url': product.image.url if product.image else '/static/img/medicines-icon.png'
                })
            
            for category in categories:
                suggestions.append({
                    'type': 'category',
                    'id': category.id,
                    'name': category.name,
                    'count': category.products.count()
                })
        
        return JsonResponse({'suggestions': suggestions})
    
    if query:
        products = Product.objects.filter(
            Q(name__icontains=query) |
            Q(category__name__icontains=query) |
            Q(description__icontains=query)
        ).distinct().select_related('category')
        
        categories = Category.objects.filter(
            Q(name__icontains=query) |
            Q(products__name__icontains=query)
        ).distinct()
    else:
        products = Product.objects.none()
        categories = Category.objects.none()
    
    context = {
        'products': products,
        'categories': categories,
        'query': query,
        'cart_count': get_cart_count(request),
        'total_results': products.count()
    }
    return render(request, 'search_results.html', context)


def shop_view(request):
    product_id = request.GET.get('product_id')
    if not product_id:
        messages.error(request, 'No product selected')
        return redirect('product')
        
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
    # Get featured products (latest 6 products)
    featured_products = Product.objects.filter(in_stock=True).order_by('-created_at')[:6]
    categories = Category.objects.all()
    
    context = {
        'featured_products': featured_products,
        'categories': categories,
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
    context = {
        'cart_count': get_cart_count(request)
    }
    return render(request, 'profile.html', context)


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
                'items_count': items_count
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
