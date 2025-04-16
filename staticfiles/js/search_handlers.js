// Event handlers for search results page
function handleQuantityClick(event, productId, action) {
    event.stopPropagation();
    updateQuantity(productId, action);
}

function handleQuantityChange(event, input) {
    event.stopPropagation();
    validateQuantity(input);
}

function handleInputClick(event) {
    event.stopPropagation();
}

function handleCartClick(event, productId) {
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.currentTarget;
    if (button.disabled || button.classList.contains('clicked')) {
        return;
    }
    
    button.classList.add('clicked');
    
    fetch(`/add-to-cart/${productId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
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
            throw new Error('Failed to add item to cart');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Update cart count in header
            const cartBadge = document.querySelector('.cart-icon .badge');
            if (cartBadge && data.cart_count !== undefined) {
                cartBadge.textContent = data.cart_count;
            }
            
            // Show success message
            showNotification('Added to cart successfully!', 'success');
            
            // Trigger cart animation
            const cartIcon = document.querySelector('.cart-icon');
            if (cartIcon) {
                cartIcon.classList.add('bounce');
                setTimeout(() => {
                    cartIcon.classList.remove('bounce');
                }, 1000);
            }
        } else {
            throw new Error(data.message || 'Failed to add item to cart');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification(error.message || 'Failed to add item to cart', 'error');
    })
    .finally(() => {
        setTimeout(() => {
            button.classList.remove('clicked');
        }, 2000);
    });
}

// Message display functions
function showSuccessMessage(message) {
    const successMessage = document.getElementById('successMessage');
    if (successMessage) {
        successMessage.querySelector('span').textContent = message;
        successMessage.style.display = 'flex';
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
    }
}

function showErrorMessage(message) {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.querySelector('span').textContent = message;
        errorMessage.style.display = 'flex';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 3000);
    }
}

// Original functions
function updateQuantity(productId, action) {
    const input = document.querySelector(`input[data-product-id="${productId}"]`);
    if (!input) return;

    const currentValue = parseInt(input.value) || 1;
    const maxStock = parseInt(input.getAttribute('max')) || 1;
    
    if (action === 'increase' && currentValue < maxStock) {
        input.value = currentValue + 1;
    } else if (action === 'decrease' && currentValue > 1) {
        input.value = currentValue - 1;
    }
}

function validateQuantity(input) {
    if (!input) return;

    const value = parseInt(input.value) || 0;
    const max = parseInt(input.getAttribute('max')) || 1;
    const min = parseInt(input.getAttribute('min')) || 1;
    
    if (value > max) {
        input.value = max;
        showErrorMessage(`Maximum quantity available is ${max}`);
    } else if (value < min) {
        input.value = min;
        showErrorMessage(`Minimum quantity required is ${min}`);
    }
}

function addToCart(productId) {
    if (!productId) {
        showNotification('Invalid product', 'error');
        return;
    }

    const button = document.querySelector(`button[onclick*="${productId}"].cart-button`);
    if (button) {
        if (button.disabled || button.classList.contains('clicked')) {
            return;
        }
        button.disabled = true;
        button.classList.add('clicked');
    }

    fetch(`/add-to-cart/${productId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
            'Accept': 'application/json'
        },
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 403) {
                window.location.href = '/login/';
                throw new Error('Please login to add items to cart');
            }
            return response.json().then(data => {
                throw new Error(data.message || 'Failed to add to cart');
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Update cart count in header
            const cartBadge = document.querySelector('.cart-icon .badge');
            if (cartBadge && data.cart_count !== undefined) {
                cartBadge.textContent = data.cart_count;
            }

            showNotification('Added to cart successfully!', 'success');

            // Trigger cart animation if available
            const cartIcon = document.querySelector('.cart-icon');
            if (cartIcon) {
                cartIcon.classList.add('bounce');
                setTimeout(() => {
                    cartIcon.classList.remove('bounce');
                }, 1000);
            }
        } else {
            throw new Error(data.message || 'Failed to add to cart');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification(error.message, 'error');
    })
    .finally(() => {
        if (button) {
            setTimeout(() => {
                button.disabled = false;
                button.classList.remove('clicked');
            }, 2000);
        }
    });
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    const container = document.getElementById('notification-container');
    if (container) {
        container.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
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
