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
    const quantityController = new QuantityController();

    // Listen for quantity changes
    document.getElementById('quantity').addEventListener('quantity-changed', (e) => {
        const quantity = parseInt(e.target.value);
        // You can perform additional actions here when quantity changes
        console.log('Quantity changed to:', quantity);
    });
});

// Add to Cart button
document.querySelector('.add-to-cart').addEventListener('click', () => {
    alert('Added to cart!');
});

// Wishlist button
document.querySelector('.wishlist').addEventListener('click', () => {
    alert('Added to wishlist!');
});

// Thumbnail click to change main image (optional)
document.querySelectorAll('.thumbnails img').forEach(thumb => {
    thumb.addEventListener('click', () => {
        const mainImage = document.querySelector('.main-image');
        mainImage.src = thumb.src;
    });
});

function addToCart(productId) {
    const quantity = parseInt(document.getElementById('quantity').value);
    const addButton = document.querySelector('.add-to-cart-btn');
    
    if (addButton) {
        addButton.disabled = true;
        addButton.classList.add('loading');
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
            
            showNotification('Added to cart successfully!', 'success');
        } else {
            throw new Error(data.error || 'Failed to add to cart');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification(error.message, 'error');
    })
    .finally(() => {
        if (addButton) {
            addButton.disabled = false;
            addButton.classList.remove('loading');
        }
    });
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

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }, 100);
}
