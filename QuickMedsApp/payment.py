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
        cart = Cart.objects.get(user=request.user)
        # Convert total to paise (including delivery fee)
        amount = int((cart.get_total() + 50) * 100)
        
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        razorpay_order = client.order.create({
            'amount': amount,
            'currency': 'INR',
            'payment_capture': '1'
        })
        
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
        
        # Extract payment details
        payment_id = data.get('razorpay_payment_id')
        order_id = data.get('razorpay_order_id')
        signature = data.get('razorpay_signature')
        
        # Get form data
        form_data = data.get('form_data', {})
        
        # Verify signature
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        params_dict = {
            'razorpay_payment_id': payment_id,
            'razorpay_order_id': order_id,
            'razorpay_signature': signature
        }
        
        try:
            client.utility.verify_payment_signature(params_dict)
        except Exception:
            return JsonResponse({
                'success': False,
                'message': 'Invalid payment signature'
            }, status=400)
        
        # Create order
        cart = Cart.objects.get(user=request.user)
        order = Order.objects.create(
            user=request.user,
            payment_id=payment_id,
            order_id=order_id,
            payment_method='razorpay',
            payment_status='paid',
            total_amount=cart.get_total() + 50,  # Including delivery fee
            first_name=form_data.get('first_name'),
            last_name=form_data.get('last_name'),
            email=form_data.get('email'),
            phone=form_data.get('phone'),
            address=form_data.get('address'),
            city=form_data.get('city'),
            state=form_data.get('state'),
            pincode=form_data.get('pincode')
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
        cart.delete()
        
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