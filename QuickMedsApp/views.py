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

<<<<<<< HEAD
# Compare this snippet from QuickMeds-Online-Pharmacy/QuickMedsApp/views.py:    

# Create your views here.
# This is the view for the base.html template
from django.shortcuts import render

=======
>>>>>>> 68537b2ae03045ff6750901c72bbe5eabb416815
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

<<<<<<< HEAD

=======
def base(request):
    return render(request, 'base.html')

def home(request):
    return render(request, 'home.html')
>>>>>>> 68537b2ae03045ff6750901c72bbe5eabb416815

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
            'cart_count': get_cart_count(request)
        }
        return render(request, 'shop.html', context)
    except Product.DoesNotExist:
        messages.error(request, 'Product not found')
        return redirect('product')
    except Exception as e:
        messages.error(request, f'Error loading product: {str(e)}')
        return redirect('product')

<<<<<<< HEAD
def base(request):
    return render(request, 'base.html')

def home(request):
    return render(request, 'home.html')

def about_view(request):
    context = {
        'cart_count': get_cart_count(request)
    }
    return render(request, 'about.html', context)
=======
def about_view(request):
    return render(request, 'about.html')
>>>>>>> 68537b2ae03045ff6750901c72bbe5eabb416815

def get_cart_count(request):
    if request.user.is_authenticated:
        return CartItem.objects.filter(cart__user=request.user).count()
    return 0

def product_view(request):
<<<<<<< HEAD
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
    
=======
    categories = Category.objects.prefetch_related('products').all()
    context = {
        'categories': categories,
        'cart_count': get_cart_count(request)
    }
    return render(request, 'product.html', context)

def register_view(request):
    if request.method == 'POST':
        try:
            name = request.POST.get('name', '').strip()
            email = request.POST.get('email', '').strip()
            mobile = request.POST.get('mobile', '').strip()
            password = request.POST.get('password', '')

            # Validate name
            if not name or len(name) < 2:
                messages.error(request, 'Please enter your full name (minimum 2 characters)')
                return redirect('login')

            # Validate email
            try:
                validate_email(email)
            except ValidationError:
                messages.error(request, 'Please enter a valid email address')
                return redirect('login')

            # Check if email already exists
            if User.objects.filter(email=email).exists():
                messages.error(request, 'Email already registered')
                return redirect('login')

            # Check if mobile number already exists
            if UserProfile.objects.filter(mobile_number=mobile).exists():
                messages.error(request, 'Mobile number already registered')
                return redirect('login')

            # Create user
            username = email
            user = User.objects.create_user(username=username, email=email, password=password)
            user.first_name = name
            user.save()

            # Create user profile
            UserProfile.objects.create(user=user, mobile_number=mobile)

            # Log the user in
            login(request, user)
            messages.success(request, 'Registration successful!')
            return redirect('home')

        except Exception as e:
            messages.error(request, f'Registration failed: {str(e)}')
            return redirect('login')

    return redirect('login')

def login_view(request):
    if request.method == 'POST':
        email = request.POST.get('email', '').strip()
        password = request.POST.get('password', '')

        # Validate input
        if not email:
            messages.error(request, 'Please enter your email address')
            return redirect('login')
        if not password:
            messages.error(request, 'Please enter your password')
            return redirect('login')

        try:
            # First get the user by email
            user = User.objects.get(email=email)
            # Then authenticate using username and password
            authenticated_user = authenticate(request, username=user.username, password=password)
            
            if authenticated_user is not None:
                login(request, authenticated_user)
                messages.success(request, f'Welcome back, {user.first_name}!')
                return redirect('home')
            else:
                messages.error(request, 'Invalid password')
        except User.DoesNotExist:
            messages.error(request, 'No account found with this email')
        except Exception as e:
            messages.error(request, 'An error occurred. Please try again.')
        
        return redirect('login')

>>>>>>> 68537b2ae03045ff6750901c72bbe5eabb416815
    return render(request, 'login.html')

def logout_view(request):
    logout(request)
    messages.success(request, 'Logged out successfully!')
<<<<<<< HEAD
    return redirect('home')
=======
    return redirect('login')
>>>>>>> 68537b2ae03045ff6750901c72bbe5eabb416815

@login_required
def profile_view(request):
    context = {
        'cart_count': get_cart_count(request)
    }
    return render(request, 'profile.html', context)

<<<<<<< HEAD

@login_required
def add_to_cart(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        product_id = data.get('product_id')
        quantity = data.get('quantity', 1)

        try:
            product = Product.objects.get(id=product_id)
            
            # Check if product is in stock
            if hasattr(product, 'in_stock') and not product.in_stock:
                return JsonResponse({
                    'success': False,
                    'error': 'Product is out of stock'
                })
                
            cart, created = Cart.objects.get_or_create(user=request.user)
            
            cart_item, item_created = CartItem.objects.get_or_create(
=======
@login_required
def add_to_cart(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            product_id = data.get('product_id')
            quantity = int(data.get('quantity', 1))
            
            if quantity < 1:
                return JsonResponse({'success': False, 'error': 'Quantity must be at least 1'})
                
            product = Product.objects.get(id=product_id)
            cart, created = Cart.objects.get_or_create(user=request.user)
            
            cart_item, created = CartItem.objects.get_or_create(
>>>>>>> 68537b2ae03045ff6750901c72bbe5eabb416815
                cart=cart,
                product=product,
                defaults={'quantity': quantity}
            )
<<<<<<< HEAD

            if not item_created:
                cart_item.quantity += quantity
                cart_item.save()

            cart_count = CartItem.objects.filter(cart__user=request.user).count()
            
            return JsonResponse({
                'success': True,
                'message': 'Added to cart successfully',
                'cart_count': cart_count
            })

        except Product.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Product not found'
            })

    return JsonResponse({'success': False, 'error': 'Invalid request'})
=======
            
            if not created:
                cart_item.quantity += quantity
                cart_item.save()
            
            cart_count = get_cart_count(request)
            
            return JsonResponse({
                'success': True,
                'message': f'Added {quantity} {product.name} to cart',
                'cart_count': cart_count
            })
            
        except Product.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Product not found'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
            
    return JsonResponse({'success': False, 'error': 'Invalid request method'})
>>>>>>> 68537b2ae03045ff6750901c72bbe5eabb416815

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

<<<<<<< HEAD

=======
>>>>>>> 68537b2ae03045ff6750901c72bbe5eabb416815
@login_required
def update_cart_item(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            item_id = data.get('item_id')
            quantity = int(data.get('quantity', 1))
            
            if quantity < 1:
                return JsonResponse({'success': False, 'error': 'Quantity must be at least 1'})
                
            cart_item = CartItem.objects.get(
                id=item_id,
                cart__user=request.user
            )
            
<<<<<<< HEAD
            # Check if product has enough stock
            if hasattr(cart_item.product, 'in_stock') and not cart_item.product.in_stock:
                return JsonResponse({'success': False, 'error': 'Product is out of stock'})
            
            cart_item.quantity = quantity
            cart_item.save()
            
            # Get updated cart information
            cart = cart_item.cart
            cart_total = cart.get_total()
            items_count = cart.cartitem_set.count()
            
=======
            cart_item.quantity = quantity
            cart_item.save()
            
>>>>>>> 68537b2ae03045ff6750901c72bbe5eabb416815
            return JsonResponse({
                'success': True,
                'message': 'Cart updated successfully',
                'new_quantity': quantity,
<<<<<<< HEAD
                'item_total': cart_item.get_total_price(),
                'cart_total': '{:,}'.format(cart_total),
                'items_count': items_count
=======
                'new_total': cart_item.get_total()
>>>>>>> 68537b2ae03045ff6750901c72bbe5eabb416815
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
<<<<<<< HEAD
            
            # Get cart before deleting the item
            cart = cart_item.cart
            
            # Delete the item
            cart_item.delete()
            
            # Get updated cart information
            cart_total = cart.get_total()
            items_count = cart.cartitem_set.count()
=======
            cart_item.delete()
            
            cart_count = get_cart_count(request)
>>>>>>> 68537b2ae03045ff6750901c72bbe5eabb416815
            
            return JsonResponse({
                'success': True,
                'message': 'Item removed from cart',
<<<<<<< HEAD
                'cart_total': '{:,}'.format(cart_total),
                'items_count': items_count
=======
                'cart_count': cart_count
>>>>>>> 68537b2ae03045ff6750901c72bbe5eabb416815
            })
            
        except CartItem.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Item not found in cart'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
            
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

def showEmptyCartMessage():
<<<<<<< HEAD
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
=======
    return JsonResponse({
        'success': False,
        'error': 'Your cart is empty'
    })
>>>>>>> 68537b2ae03045ff6750901c72bbe5eabb416815
