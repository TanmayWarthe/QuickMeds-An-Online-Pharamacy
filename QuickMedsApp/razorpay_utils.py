import razorpay
from django.conf import settings

# Initialize Razorpay client
client = razorpay.Client(
    auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
)

def create_order(amount, currency='INR'):
    """
    Create a Razorpay order
    :param amount: Amount in paise (1 INR = 100 paise)
    :param currency: Currency code (default: INR)
    :return: order data
    """
    try:
        data = {
            'amount': amount,
            'currency': currency,
            'payment_capture': 1  # Auto capture payment
        }
        order = client.order.create(data=data)
        return {
            'success': True,
            'order_id': order['id'],
            'amount': order['amount'],
            'currency': order['currency']
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def verify_payment(payment_id, order_id, signature):
    """
    Verify Razorpay payment signature
    :param payment_id: Razorpay payment ID
    :param order_id: Razorpay order ID
    :param signature: Razorpay signature
    :return: bool
    """
    try:
        client.utility.verify_payment_signature({
            'razorpay_payment_id': payment_id,
            'razorpay_order_id': order_id,
            'razorpay_signature': signature
        })
        return True
    except razorpay.errors.SignatureVerificationError:
        return False 