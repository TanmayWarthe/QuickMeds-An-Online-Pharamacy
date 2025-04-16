document.addEventListener('DOMContentLoaded', function() {
    const cartButtons = document.querySelectorAll('.cart-button');
    
    cartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (this.disabled || this.classList.contains('clicked')) {
                return;
            }
            
            const productId = this.getAttribute('data-product-id');
            if (!productId) return;
            
            this.classList.add('clicked');
            this.disabled = true;
            
            fetch(`/add-to-cart/${productId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    quantity: 1
                })
            })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 403) {
                        window.location.href = '/login/';
                        return;
                    }
                    throw new Error('Failed to add to cart');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    const cartBadge = document.querySelector('.cart-icon .badge');
                    if (cartBadge && data.cart_count !== undefined) {
                        cartBadge.textContent = data.cart_count;
                    }
                    showNotification('Added to cart successfully!', 'success');
                } else {
                    throw new Error(data.message || 'Failed to add to cart');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification(error.message, 'error');
            })
            .finally(() => {
                const button = this;
                setTimeout(() => {
                    button.disabled = false;
                    button.classList.remove('clicked');
                }, 2000);
            });
        });
    });
});

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

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
