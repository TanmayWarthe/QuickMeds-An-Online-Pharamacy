class QuantityController {
    constructor() {
        this.input = document.getElementById('quantity');
        this.minusBtn = document.querySelector('.quantity-btn.minus');
        this.plusBtn = document.querySelector('.quantity-btn.plus');
        this.maxStock = parseInt(this.input.getAttribute('max')) || 99999;
        
        this.initialize();
    }

    initialize() {
        // Set initial state
        this.updateButtonStates();

        // Add event listeners
        this.minusBtn.addEventListener('click', () => this.decrease());
        this.plusBtn.addEventListener('click', () => this.increase());
        
        // Input event listeners
        this.input.addEventListener('input', () => this.handleManualInput());
        this.input.addEventListener('blur', () => this.validateOnBlur());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.input.blur();
            }
        });

        // Add touch feedback
        [this.minusBtn, this.plusBtn].forEach(btn => {
            btn.addEventListener('click', () => this.addClickEffect(btn));
        });
    }

    decrease() {
        const currentValue = parseInt(this.input.value);
        if (currentValue > 1) {
            this.updateValue(currentValue - 1);
        }
    }

    increase() {
        const currentValue = parseInt(this.input.value);
        if (currentValue < this.maxStock) {
            this.updateValue(currentValue + 1);
        }
    }

    updateValue(value) {
        this.input.value = value;
        this.updateButtonStates();
        this.triggerChangeEvent();
    }

    handleManualInput() {
        let value = this.input.value.replace(/[^\d]/g, '');
        
        // Remove leading zeros
        value = value.replace(/^0+/, '') || '1';
        
        // Ensure the value is within bounds
        value = Math.max(1, Math.min(parseInt(value) || 1, this.maxStock));
        
        this.updateValue(value);
    }

    validateOnBlur() {
        let value = parseInt(this.input.value) || 1;
        value = Math.max(1, Math.min(value, this.maxStock));
        this.updateValue(value);
    }

    updateButtonStates() {
        const currentValue = parseInt(this.input.value);
        
        // Update minus button
        this.minusBtn.classList.toggle('disabled', currentValue <= 1);
        this.minusBtn.disabled = currentValue <= 1;

        // Update plus button
        this.plusBtn.classList.toggle('disabled', currentValue >= this.maxStock);
        this.plusBtn.disabled = currentValue >= this.maxStock;
    }

    addClickEffect(button) {
        button.classList.add('pressed');
        setTimeout(() => button.classList.remove('pressed'), 200);
    }

    triggerChangeEvent() {
        const event = new Event('quantity-changed', {
            bubbles: true,
            cancelable: true
        });
        this.input.dispatchEvent(event);
    }
}

// In the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    // Initialize quantity controller if element exists
    if (document.getElementById('quantity')) {
        new QuantityController();
        
        // Listen for quantity changes
        document.getElementById('quantity').addEventListener('quantity-changed', (e) => {
            const quantity = parseInt(e.target.value);
            console.log('Quantity changed to:', quantity);
        });
    }
    
    // Update Buy Now button handler
    const buyNowBtn = document.querySelector('.buy-now-btn');
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', function() {
            const productId = this.dataset.productId || this.getAttribute('data-product-id');
            if (!productId) {
                showNotification('Product ID not found', 'error');
                return;
            }
            handleBuyNow(productId);
        });
    }

    // Update Add to Cart button handler
    const addToCartBtn = document.querySelector('.add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function(event) {
            const productId = this.dataset.productId || this.getAttribute('data-product-id');
            if (!productId) {
                showNotification('Product ID not found', 'error');
                return;
            }
            handleCartClick(event, productId);
        });
    }
});

/**
 * Handle Add to Cart button click
 * @param {Event} event - Click event
 * @param {string} productId - Product ID
 */
function handleCartClick(event, productId) {
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.currentTarget;
    if (button.disabled || button.classList.contains('clicked')) {
        return;
    }
    
    button.classList.add('clicked');
    
    const quantity = document.querySelector('.quantity-input').value;
    
    fetch(`/add-to-cart/${productId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            quantity: quantity
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
            // Update cart count
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

            // Reset button after animation completes
            setTimeout(() => {
                button.classList.remove('clicked');
            }, 2000);
        } else {
            throw new Error(data.message || 'Failed to add item to cart');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification(error.message, 'error');
        button.classList.remove('clicked');
    });
}

/**
 * Handle Buy Now button click
 * @param {string} productId - Product ID
 */
function handleBuyNow(productId) {
    const quantity = parseInt(document.getElementById('quantity').value) || 1;
    const button = document.querySelector('.buy-now-btn');
    
    if (button.disabled || button.classList.contains('clicked')) {
        return;
    }

    button.classList.add('clicked');
    
    fetch('/create-checkout-session/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify({
            product_id: productId,
            quantity: quantity,
            buy_now: true
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.message || 'Failed to process buy now request');
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Redirect to checkout page using the provided URL
            window.location.href = data.redirect_url;
        } else {
            throw new Error(data.message || 'Failed to process buy now request');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification(error.message, 'error');
        button.classList.remove('clicked');
    })
    .finally(() => {
        setTimeout(() => {
            button.classList.remove('clicked');
        }, 2000);
    });
}

/**
 * Get CSRF token from cookies
 * @param {string} name - Cookie name
 * @returns {string} Cookie value
 */
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

/**
 * Show notification message
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (success or error)
 */
function showNotification(message, type) {
    // Clear any existing notifications first
    const existingSuccess = document.getElementById('successMessage');
    const existingError = document.getElementById('errorMessage');
    
    if (existingSuccess) existingSuccess.style.display = 'none';
    if (existingError) existingError.style.display = 'none';
    
    if (type === 'success') {
        const successMessage = document.getElementById('successMessage');
        if (successMessage) {
            successMessage.style.display = 'flex';
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 3000);
        }
    } else {
        const errorMessage = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        if (errorMessage && errorText) {
            errorText.textContent = message;
            errorMessage.style.display = 'flex';
            setTimeout(() => {
                errorMessage.style.display = 'none';
            }, 3000);
        }
    }
}
