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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize quantity controller if element exists
    if (document.getElementById('quantity')) {
        const quantityController = new QuantityController();
        
        // Listen for quantity changes
        document.getElementById('quantity').addEventListener('quantity-changed', (e) => {
            const quantity = parseInt(e.target.value);
            console.log('Quantity changed to:', quantity);
        });
    }
    
    // Initialize Buy Now button
    const buyNowBtn = document.querySelector('.buy-now-btn');
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', function() {
            const productId = this.getAttribute('data-product-id');
            const quantity = document.getElementById('quantity').value;
            
            // Redirect to checkout with product and quantity
            window.location.href = `/checkout/?product_id=${productId}&quantity=${quantity}`;
        });
    }
});

/**
 * Add product to cart
 * @param {string} productId - ID of the product to add
 */
function addToCart(productId) {
    const quantityInput = document.getElementById('quantity');
    if (!quantityInput) {
        showNotification('Error: Could not find quantity input', 'error');
        return;
    }
    
    const quantity = parseInt(quantityInput.value);
    const stockLimit = parseInt(quantityInput.getAttribute('max')) || 99999;
    
    // Validate quantity against stock limit
    if (quantity > stockLimit) {
        showNotification('Requested quantity exceeds available stock!', 'error');
        return;
    }
    
    const addButton = document.querySelector('.add-to-cart-btn');
    
    if (addButton) {
        addButton.disabled = true;
        addButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    }

    fetch('/add-to-cart/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify({
            product_id: productId,
            quantity: quantity
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Update cart count
            const cartBadge = document.querySelector('.cart-icon .badge');
            if (cartBadge) {
                cartBadge.textContent = data.cart_count;
            }
            
            // Show success message
            const successMessage = document.getElementById('successMessage');
            if (successMessage) {
                successMessage.style.display = 'flex';
                setTimeout(() => {
                    successMessage.style.display = 'none';
                }, 3000);
            } else {
                showNotification('Added to cart successfully!', 'success');
            }
        } else {
            throw new Error(data.error || 'Failed to add to cart');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        
        // Show error message
        const errorMessage = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        
        if (errorMessage && errorText) {
            errorText.textContent = error.message;
            errorMessage.style.display = 'flex';
            setTimeout(() => {
                errorMessage.style.display = 'none';
            }, 3000);
        } else {
            showNotification(error.message, 'error');
        }
    })
    .finally(() => {
        if (addButton) {
            addButton.disabled = false;
            addButton.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
        }
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
    const notificationContainer = document.getElementById('notification-container');
    
    if (notificationContainer) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Simple success message with icon
        let icon = type === 'success' ? '✓' : '!';
        let displayMessage = type === 'success' ? '✓ Added to cart' : message;
        
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-text">${displayMessage}</span>
                <button class="close-notification">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            ${type === 'success' ? '<div class="notification-progress"></div>' : ''}
        `;
        
        // Add close button functionality
        const closeBtn = notification.querySelector('.close-notification');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                notification.classList.add('fade-out');
                setTimeout(() => notification.remove(), 300);
            });
        }
        
        notificationContainer.appendChild(notification);
        
        // Show notification with animation
        requestAnimationFrame(() => {
            notification.classList.add('show');
            
            // Auto-hide after 2 seconds (even shorter)
            setTimeout(() => {
                notification.classList.add('fade-out');
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        });
    } else {
        // Fallback if notification container doesn't exist
        alert(message);
    }
}
