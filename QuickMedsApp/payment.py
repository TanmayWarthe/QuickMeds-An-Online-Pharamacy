import razorpay
from django.conf import settings
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from .models import Order, OrderItem, Cart
import json

# Initialize Razorpay client
client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

@require_POST
def create_payment_order(request):
    try:
        # Parse request data
        data = json.loads(request.body)
        address = data.get('address')
        
        if not address:
            return JsonResponse({
                'success': False,
                'message': 'Address is required'
            }, status=400)
        
        # Get cart and calculate total amount
        cart = Cart.objects.get(user=request.user)
        amount = int((cart.get_total() + 50) * 100)  # Convert to paise (including delivery fee)
        
        # Create Razorpay Order
        razorpay_order = client.order.create({
            'amount': amount,
            'currency': 'INR',
            'payment_capture': '1'
        })
        
        # Store address in session for later use
        request.session['checkout_address'] = address
        
        return JsonResponse({
            'success': True,
            'order_id': razorpay_order['id'],
            'amount': amount,
            'currency': 'INR'
        })
    except Cart.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Cart not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_POST
def payment_callback(request):
    try:
        data = json.loads(request.body)
        razorpay_payment_id = data.get('razorpay_payment_id')
        razorpay_order_id = data.get('razorpay_order_id')
        razorpay_signature = data.get('razorpay_signature')
        
        # Get address from session
        address = request.session.get('checkout_address')
        if not address:
            return JsonResponse({
                'success': False,
                'message': 'Address not found'
            }, status=400)
        
        # Verify payment signature
        params_dict = {
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_order_id': razorpay_order_id,
            'razorpay_signature': razorpay_signature
        }
        
        try:
            client.utility.verify_payment_signature(params_dict)
        except Exception:
            return JsonResponse({
                'success': False,
                'message': 'Invalid payment signature'
            }, status=400)
        
        # Get cart
        cart = Cart.objects.get(user=request.user)
        
        # Create order
        order = Order.objects.create(
            user=request.user,
            order_id=razorpay_order_id,
            payment_id=razorpay_payment_id,
            payment_method='online',
            payment_status='paid',
            order_status='processing',
            address=address,
            total_amount=cart.get_total() + 50  # Including delivery fee
        )
        
        # Create order items
        for cart_item in cart.cartitem_set.all():
            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                quantity=cart_item.quantity,
                price=cart_item.product.price
            )
        
        # Clear cart and session data
        cart.cartitem_set.all().delete()
        if 'checkout_address' in request.session:
            del request.session['checkout_address']
        
        return JsonResponse({
            'success': True,
            'message': 'Payment successful',
            'order_id': order.id
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@require_POST
def place_order(request):
    try:
        data = json.loads(request.body)
        address = data.get('address')
        payment_method = data.get('payment_method', 'cod')
        
        if not address:
            return JsonResponse({
                'success': False,
                'message': 'Address is required'
            }, status=400)
        
        # Get cart
        cart = Cart.objects.get(user=request.user)
        
        # Create order
        order = Order.objects.create(
            user=request.user,
            payment_method=payment_method,
            payment_status='pending' if payment_method == 'cod' else 'paid',
            order_status='processing',
            address=address,
            total_amount=cart.get_total() + 50  # Including delivery fee
        )
        
        # Create order items
        for cart_item in cart.cartitem_set.all():
            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                quantity=cart_item.quantity,
                price=cart_item.product.price
            )
        
        # Clear cart
        cart.cartitem_set.all().delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Order placed successfully',
            'order_id': order.id
        })
        
    except Cart.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Cart not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500) 