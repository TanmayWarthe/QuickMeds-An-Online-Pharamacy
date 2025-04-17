document.addEventListener('DOMContentLoaded', function() {
    // Add click event listeners to all cancel order buttons
    document.querySelectorAll('.btn-cancel-order').forEach(button => {
        button.addEventListener('click', function() {
            const orderId = this.dataset.orderId;
            
            // Show confirmation dialog
            if (confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
                cancelOrder(orderId, this);
            }
        });
    });
});

function cancelOrder(orderId, buttonElement) {
    // Disable the button and show loading state
    buttonElement.disabled = true;
    buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cancelling...';
    
    // Send request to cancel the order
    fetch(`/orders/${orderId}/cancel/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update the order status in the UI
            const orderCard = buttonElement.closest('.order-card');
            const statusElement = orderCard.querySelector('.order-status');
            
            // Update status display with delete icon
            statusElement.className = 'order-status cancelled';
            statusElement.innerHTML = `
                <i class="fas fa-circle"></i>
                CANCELLED
                <span class="delete-icon" onclick="deleteOrder('${orderId}', this)" title="Delete cancelled order">
                    <i class="fas fa-trash-alt"></i>
                </span>
            `;
            
            // Remove the cancel button
            buttonElement.remove();
            
            // Show success message
            showNotification('Order cancelled successfully', 'success');
        } else {
            // Show error message
            showNotification(data.message || 'Failed to cancel order', 'error');
            
            // Reset button state
            buttonElement.disabled = false;
            buttonElement.innerHTML = '<i class="fas fa-times"></i> Cancel Order';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Failed to cancel order', 'error');
        
        // Reset button state
        buttonElement.disabled = false;
        buttonElement.innerHTML = '<i class="fas fa-times"></i> Cancel Order';
    });
}

function deleteOrder(orderId, element) {
    if (confirm('Are you sure you want to delete this cancelled order? This action cannot be undone.')) {
        // Find the order card
        const orderCard = element.closest('.order-card');
        if (!orderCard) return;

        // Show loading state
        const originalContent = element.innerHTML;
        element.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        element.style.pointerEvents = 'none';
        
        // Send request to delete the order
        fetch(`/orders/${orderId}/delete/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Add fade-out animation class
                orderCard.style.transition = 'all 0.5s ease';
                orderCard.style.opacity = '0';
                orderCard.style.transform = 'translateX(-20px)';
                
                // Remove the card after animation
                setTimeout(() => {
                    orderCard.remove();
                    showNotification('Order deleted successfully', 'success');
                }, 500);
            } else {
                // Reset the icon and show error
                element.innerHTML = originalContent;
                element.style.pointerEvents = 'auto';
                showNotification(data.message || 'Failed to delete order', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            // Reset the icon and show error
            element.innerHTML = originalContent;
            element.style.pointerEvents = 'auto';
            showNotification('Failed to delete order', 'error');
        });
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
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove notification after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
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