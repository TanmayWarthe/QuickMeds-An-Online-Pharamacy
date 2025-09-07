document.addEventListener('DOMContentLoaded', function() {
    initializeOrderButtons();
    setupNotificationSystem();
});

function initializeOrderButtons() {
    document.querySelectorAll('.btn-cancel-order').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            handleOrderCancellation(this);
        });
    });
}

function handleOrderCancellation(button) {
    const orderId = button.dataset.orderId;
    const orderStatus = button.dataset.orderStatus;
    const orderAge = button.dataset.orderAge;
    
    if (!canCancelOrder(orderStatus, orderAge)) {
        return;
    }
    
    const confirmMessage = getConfirmationMessage(orderStatus);
    if (confirm(confirmMessage)) {
        cancelOrder(orderId, button);
    }
}

function canCancelOrder(status, age) {
    if (status === 'SHIPPED') {
        showNotification('Orders that have been shipped cannot be cancelled.', 'error');
        return false;
    }
    
    if (status === 'DELIVERED' || status === 'CANCELLED') {
        showNotification(`Cannot cancel order as it is already ${status.toLowerCase()}.`, 'error');
        return false;
    }
    
    if (status === 'PROCESSING' && isOrderTooOld(age)) {
        showNotification('Orders in processing state can only be cancelled within 24 hours.', 'error');
        return false;
    }
    
    return true;
}

function isOrderTooOld(age) {
    // Convert age string to hours (approximate)
    const hours = age.includes('day') ? parseInt(age) * 24 : 
                 age.includes('hour') ? parseInt(age) : 0;
    return hours > 24;
}

function getConfirmationMessage(status) {
    if (status === 'PROCESSING') {
        return 'This order is being processed. Cancelling now may affect ongoing operations. Are you sure?';
    }
    return 'Are you sure you want to cancel this order? This action cannot be undone.';
}

function cancelOrder(orderId, button) {
    const loadingOverlay = showLoadingOverlay('Cancelling your order...');
    disableButton(button, 'Cancelling...');
    
    fetch(`/orders/${orderId}/cancel/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Order not found or invalid URL');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        hideLoadingOverlay(loadingOverlay);
        handleCancellationSuccess(data, button);
    })
    .catch(error => {
        console.error('Error:', error);
        hideLoadingOverlay(loadingOverlay);
        handleCancellationError(button, error);
    });
}

function handleCancellationSuccess(data, button) {
    if (data.success) {
        updateOrderUI(button, data);
        showNotification(getCancellationSuccessMessage(data), 'success');
        refreshOrderListIfNeeded();
    } else {
        resetButton(button);
        showNotification(data.message || 'Failed to cancel order', 'error');
    }
}

function handleCancellationError(button, error) {
    resetButton(button);
    let errorMessage = 'Failed to cancel order. Please try again or contact support.';
    
    if (error.message.includes('404')) {
        errorMessage = 'Unable to cancel order. The order may have been already cancelled or deleted.';
    } else if (error.message.includes('JSON')) {
        errorMessage = 'Server error occurred. Please try again later.';
    }
    
    showNotification(errorMessage, 'error');
    console.error('Error details:', error);
}

function updateOrderUI(button, data) {
    try {
        const orderCard = button.closest('.order-card');
        if (!orderCard) {
            console.error('Order card not found');
            return;
        }
        updateOrderStatus(orderCard);
        updatePaymentStatus(orderCard, data.payment_status);
        replaceWithDeleteButton(button, orderCard.dataset.orderId);
    } catch (error) {
        console.error('Error updating UI:', error);
        showNotification('Order was cancelled but display could not be updated. Please refresh the page.', 'warning');
    }
}

function updateOrderStatus(orderCard) {
    const statusElement = orderCard.querySelector('.order-status');
    statusElement.className = `order-status ${getStatusClass('CANCELLED')}`;
    statusElement.innerHTML = '<i class="fa-solid fa-circle me-2" aria-hidden="true"></i>CANCELLED';
}

function updatePaymentStatus(orderCard, paymentStatus) {
    const paymentElement = orderCard.querySelector('.payment-status');
    if (paymentElement && paymentStatus) {
        paymentElement.className = `payment-status ${getPaymentStatusClass(paymentStatus)}`;
        paymentElement.innerHTML = `
            <i class="fas fa-money-bill-wave me-2"></i>
            ${formatPaymentStatus(paymentStatus)}
        `;
    }
}

function replaceWithDeleteButton(button, orderId) {
    const actionsContainer = button.parentElement;
    actionsContainer.innerHTML = `
        <button class="btn btn-outline-danger btn-sm" 
                onclick="deleteOrder(null, this)" 
                data-order-id="${orderId}"
                title="Delete cancelled order">
            <i class="fa-solid fa-trash" aria-hidden="true"></i><span class="ms-1">Delete Order</span>
        </button>
    `;
}

function deleteOrder(orderId, button) {
    // Get orderId from data attribute if not passed directly
    if (!orderId) {
        orderId = button.dataset.orderId;
    }
    
    if (!orderId) {
        showNotification('Invalid order ID', 'error');
        return;
    }

    if (!confirm('Are you sure you want to delete this cancelled order? This action cannot be undone.')) {
        return;
    }

    const orderCard = button.closest('.order-card');
    const loadingOverlay = showLoadingOverlay('Deleting order...');
    disableButton(button);

    // Ensure orderId is properly formatted in the URL
    const url = `/orders/${encodeURIComponent(orderId)}/delete/`;

    fetch(url, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            }
        })
    .then(response => {
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Order not found');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
        .then(data => {
        hideLoadingOverlay(loadingOverlay);
            if (data.success) {
            handleSuccessfulDeletion(orderCard);
            } else {
            handleFailedDeletion(button, data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        hideLoadingOverlay(loadingOverlay);
        handleFailedDeletion(button, error.message);
    });
}

function handleSuccessfulDeletion(orderCard) {
    animateAndRemoveCard(orderCard);
    showNotification('Order deleted successfully', 'success');
    checkEmptyOrders();
}

function handleFailedDeletion(button, message = null) {
    resetButton(button, '<i class="fas fa-trash-alt"></i> Delete Order');
    showNotification(message || 'Failed to delete order. Please try again.', 'error');
}

function animateAndRemoveCard(orderCard) {
    orderCard.style.transition = 'all 0.5s ease';
    orderCard.style.opacity = '0';
    orderCard.style.transform = 'translateX(-20px)';
    setTimeout(() => orderCard.remove(), 500);
}

function checkEmptyOrders() {
    if (document.querySelectorAll('.order-card').length === 0) {
        showEmptyOrdersMessage();
    }
}

// Utility Functions
function disableButton(button, text = null) {
    button.disabled = true;
    if (text) {
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
    }
}

function resetButton(button, html = '<i class="fas fa-times"></i> Cancel Order') {
    button.disabled = false;
    button.innerHTML = html;
}

function showLoadingOverlay(message) {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div class="loading-content">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3">${message}</p>
        </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
}

function hideLoadingOverlay(overlay) {
    if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
    }
}

function showEmptyOrdersMessage() {
    const container = document.querySelector('.orders-container');
    if (container) {
        container.innerHTML = `
            <div class="empty-orders">
                <i class="fas fa-shopping-bag mb-3"></i>
                <h3>No Orders Found</h3>
                <p class="text-muted">You haven't placed any orders yet.</p>
                <a href="/product" class="btn btn-primary mt-3">
                    <i class="fas fa-shopping-cart"></i> Start Shopping
                </a>
            </div>
        `;
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function setupNotificationSystem() {
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(120%);
            transition: transform 0.3s ease;
            z-index: 10000;
        }
        .notification.show {
            transform: translateX(0);
        }
        .notification.success {
            border-left: 4px solid #28a745;
        }
        .notification.error {
            border-left: 4px solid #dc3545;
        }
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .notification i {
            font-size: 1.25rem;
        }
        .notification.success i {
            color: #28a745;
        }
        .notification.error i {
            color: #dc3545;
        }
    `;
    document.head.appendChild(style);
}

function getStatusClass(status) {
    const statusClasses = {
        'PENDING': 'status-pending',
        'PROCESSING': 'status-processing',
        'SHIPPED': 'status-shipped',
        'DELIVERED': 'status-delivered',
        'CANCELLED': 'status-cancelled'
    };
    return statusClasses[status] || '';
}

function getPaymentStatusClass(status) {
    const statusClasses = {
        'PENDING': 'payment-pending',
        'COMPLETED': 'payment-completed',
        'FAILED': 'payment-failed',
        'REFUNDED': 'payment-refunded',
        'REFUND_PENDING': 'payment-refund-pending'
    };
    return statusClasses[status] || '';
}

function formatPaymentStatus(status) {
    return status.replace('_', ' ').charAt(0) + status.slice(1).toLowerCase();
}

function getCancellationSuccessMessage(data) {
    let message = 'Order cancelled successfully.';
    if (data.payment_status === 'REFUND_PENDING') {
        message += ' Refund will be processed shortly.';
    } else if (data.payment_status === 'REFUNDED') {
        message += ' Refund has been initiated.';
    }
    return message;
}

function refreshOrderListIfNeeded() {
    if (typeof refreshOrderList === 'function') {
        setTimeout(refreshOrderList, 2000);
    }
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
} 