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
    fetch(`/cancel-order/${orderId}/`, {
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
            
            // Update status display
            statusElement.className = 'order-status cancelled';
            statusElement.innerHTML = '<i class="fas fa-circle"></i> Cancelled';
            
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