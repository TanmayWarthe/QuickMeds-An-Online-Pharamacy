document.addEventListener('DOMContentLoaded', function() {
    updateCartCount(); // Initialize cart count on page load
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
                credentials: 'same-origin',
                body: JSON.stringify({
                    quantity: 1
                })
            })
            .then(response => {
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error('Invalid response format');
                }
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
                    updateCartBadge(data.cart_count);
                    showNotification('Added to cart successfully!', 'success');
                } else {
                    throw new Error(data.message || 'Failed to add to cart');
                }
            })
            .catch(error => {
                showNotification(error.message || 'Failed to add to cart', 'error');
            })
            .finally(() => {
                this.classList.remove('clicked');
                this.disabled = false;
            });
        });
    });
});

function updateCartCount() {
    fetch('/get-cart-count/', {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        credentials: 'same-origin'
    })
    .then(response => {
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Invalid response format');
        }
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            updateCartBadge(data.cart_count);
        }
    })
    .catch(error => {
        // Silently handle errors and hide the badge
        updateCartBadge(0);
    });
}

function updateCartBadge(count) {
    const cartBadge = document.querySelector('.nav-cart .cart-badge') || document.querySelector('.cart-icon .badge');
    if (cartBadge) {
        if (count > 0) {
            cartBadge.textContent = count;
            cartBadge.style.display = 'flex';
        } else {
            cartBadge.style.display = 'none';
        }
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

function showNotification(message, type = 'success') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

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
