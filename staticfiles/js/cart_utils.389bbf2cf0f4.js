// Shared cart functionality for the application

// Update cart count in the UI
function updateCartCount(count) {
    const cartBadge = document.querySelector('.cart-icon .badge');
    if (!cartBadge) return;

    if (count > 0) {
        cartBadge.style.display = 'flex';
        cartBadge.textContent = count;
    } else {
        cartBadge.style.display = 'none';
    }
}

// Add item to cart with proper error handling and animations
async function addToCart(productId, quantity = 1) {
    const button = document.querySelector(`button[data-product-id="${productId}"]`);
    if (button) {
        if (button.disabled || button.classList.contains('clicked')) {
            return;
        }
        button.disabled = true;
        button.classList.add('clicked');
    }

    try {
        const response = await fetch(`/add-to-cart/${productId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
                'Accept': 'application/json'
            },
            body: JSON.stringify({ quantity })
        });

        if (!response.ok) {
            if (response.status === 403) {
                window.location.href = '/login/';
                return;
            }
            throw new Error('Failed to add item to cart');
        }

        const data = await response.json();
        if (data.success) {
            updateCartCount(data.cart_count);
            showNotification('Added to cart successfully!', 'success');
            animateCartIcon();
        } else {
            throw new Error(data.message || 'Failed to add item to cart');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message || 'Failed to add item to cart', 'error');
    } finally {
        if (button) {
            setTimeout(() => {
                button.disabled = false;
                button.classList.remove('clicked');
            }, 2000);
        }
    }
}

// Animate cart icon
function animateCartIcon() {
    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon) {
        cartIcon.classList.add('cart-animation');
        setTimeout(() => {
            cartIcon.classList.remove('cart-animation');
        }, 1000);
    }
}

// Show notification message
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove notification after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Get CSRF token from cookies
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