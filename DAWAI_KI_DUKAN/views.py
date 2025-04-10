@login_required
def orders(request):
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'orders.html', {'orders': orders})

def order_confirmation(request, order_id):
    try:
        order = Order.objects.get(id=order_id, user=request.user)
        return render(request, 'order_confirmation.html', {'order': order})
    except Order.DoesNotExist:
        messages.error(request, 'Order not found.')
        return redirect('orders')

@login_required
def cancel_order(request, order_id):
    if request.method == 'POST':
        try:
            order = Order.objects.get(id=order_id, user=request.user)
            if order.order_status in ['PENDING', 'PROCESSING']:
                order.order_status = 'CANCELLED'
                order.save()
                messages.success(request, 'Order cancelled successfully.')
                return JsonResponse({'status': 'success'})
            else:
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