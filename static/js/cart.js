function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

document.addEventListener('DOMContentLoaded', function() {
    // Get all quantity buttons and inputs
    const quantityBtns = document.querySelectorAll('.quantity-btn');
    const removeBtns = document.querySelectorAll('.remove-btn');
    
    // Add event listeners to quantity buttons
    quantityBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const itemId = this.dataset.itemId;
            const input = this.parentElement.querySelector('.quantity-input');
            let value = parseInt(input.value);
            
            // Check if it's plus or minus button
            if (this.classList.contains('minus')) {
                if (value > 1) {
                    input.value = value - 1;
                    updateQuantityOnServer(itemId, value - 1);
                }
            } else {
                if (value < 99) {
                    input.value = value + 1;
                    updateQuantityOnServer(itemId, value + 1);
                }
            }
            
            // Update button states
            updateButtonStates(itemId, parseInt(input.value));
        });
    });
    
    // Add event listeners to remove buttons
    removeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = this.dataset.itemId;
            removeItem(itemId);
        });
    });
});

// Function to update button states
function updateButtonStates(itemId, value) {
    const decreaseBtn = document.querySelector(`.quantity-btn.minus[data-item-id="${itemId}"]`);
    const increaseBtn = document.querySelector(`.quantity-btn.plus[data-item-id="${itemId}"]`);
    
    if (decreaseBtn) {
        decreaseBtn.disabled = value <= 1;
    }
    if (increaseBtn) {
        increaseBtn.disabled = value >= 99;
    }
}

// Function to update quantity on server
function updateQuantityOnServer(itemId, quantity) {
    const input = document.querySelector(`.quantity-input[data-item-id="${itemId}"]`);
    const itemContainer = document.querySelector(`.cart-item[data-item-id="${itemId}"]`);
    
    if (itemContainer) {
        itemContainer.classList.add('updating');
    }

    fetch('/update-cart-item/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
            item_id: itemId,
            quantity: quantity
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Silently update all values
            updateCartDisplay(data);
            
            // Update item total with animation
            const totalEl = document.querySelector(`.item-total[data-item-id="${itemId}"]`);
            if (totalEl && data.item_total) {
                totalEl.classList.add('price-update');
                totalEl.textContent = data.item_total;
                setTimeout(() => totalEl.classList.remove('price-update'), 300);
            }
            
            // Update quantity input
            if (input) {
                input.value = quantity;
                updateButtonStates(itemId, quantity);
            }
        }
    })
    .catch(error => {
        console.error('Error:', error);
        // Only show error for actual errors
        if (input) input.value = input.defaultValue;
    })
    .finally(() => {
        if (itemContainer) {
            itemContainer.classList.remove('updating');
        }
    });
}

// Function to update cart display
function updateCartDisplay(data) {
    // Update cart total with animation
    const cartTotal = document.getElementById('cart-total');
    if (cartTotal) {
        cartTotal.classList.add('price-update');
        cartTotal.textContent = data.cart_total;
        setTimeout(() => cartTotal.classList.remove('price-update'), 300);
    }
    
    // Update items count
    const itemsCount = document.getElementById('items-count');
    if (itemsCount) {
        itemsCount.textContent = data.items_count;
    }
    
    // Update cart count in header with animation
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        cartCount.classList.add('cart-updated');
        cartCount.textContent = data.items_count;
        cartCount.style.display = data.items_count > 0 ? 'block' : 'none';
        setTimeout(() => cartCount.classList.remove('cart-updated'), 300);
    }
}

// Function to show error message
function showError(message) {
    // Remove any existing error messages
    const existingErrors = document.querySelectorAll('.error-message');
    existingErrors.forEach(error => error.remove());

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    
    // Create icon element
    const icon = document.createElement('i');
    icon.className = 'fas fa-exclamation-circle';
    errorDiv.appendChild(icon);
    
    // Create message text
    const messageText = document.createElement('span');
    messageText.textContent = message;
    errorDiv.appendChild(messageText);
    
    document.body.appendChild(errorDiv);
    
    // Add show class for animation
    setTimeout(() => {
        errorDiv.classList.add('show');
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        errorDiv.classList.remove('show');
        setTimeout(() => {
            errorDiv.remove();
        }, 300);
    }, 3000);
}

// Function to show success message
function showSuccess(message) {
    // Remove any existing messages
    const existingMessages = document.querySelectorAll('.success-message, .error-message');
    existingMessages.forEach(msg => msg.remove());

    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    
    // Create icon element
    const icon = document.createElement('i');
    icon.className = 'fas fa-check-circle';
    successDiv.appendChild(icon);
    
    // Create message text
    const messageText = document.createElement('span');
    messageText.textContent = message;
    successDiv.appendChild(messageText);
    
    document.body.appendChild(successDiv);
    
    // Add show class for animation
    setTimeout(() => {
        successDiv.classList.add('show');
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        successDiv.classList.remove('show');
        setTimeout(() => {
            successDiv.remove();
        }, 300);
    }, 2000);
}

// Function to revert quantity change
function revertQuantityChange(itemId, originalQuantity) {
    const input = document.querySelector(`.quantity-input[data-item-id="${itemId}"]`);
    if (input) {
        input.value = originalQuantity;
        updateButtonStates(itemId, originalQuantity);
    }
}

// Function to remove item
function removeItem(itemId) {
    if (!confirm('Are you sure you want to remove this item?')) return;
    
    fetch('/remove-cart-item/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            item_id: itemId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Remove the item from DOM
            const itemElement = document.querySelector(`.cart-item[data-item-id="${itemId}"]`);
            itemElement.remove();
            
            // Update cart total
            document.getElementById('cart-total').textContent = data.cart_total;
            document.getElementById('items-count').textContent = data.items_count;
            
            // Update cart count in header
            updateCartCount(data.items_count);
            
            // Show empty cart message if no items left
            if (data.items_count === 0) {
                showEmptyCart();
            }
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Function to show empty cart message
function showEmptyCart() {
    const cartItems = document.querySelector('.cart-items');
    const cartSummary = document.querySelector('.cart-summary');
    
    // Fade out cart summary if it exists
    if (cartSummary) {
        cartSummary.style.opacity = '0';
        cartSummary.style.transform = 'translateY(20px)';
        setTimeout(() => {
            cartSummary.remove();
        }, 300);
    }
    
    // Create and insert empty cart message with animation
    cartItems.innerHTML = `
        <div class="empty-cart" style="opacity: 0; transform: translateY(20px);">
            <i class="fas fa-shopping-basket"></i>
            <p>Your cart is empty</p>
            <div class="empty-cart-actions">
                <a href="/product/" class="shop-now-btn">
                    <i class="fas fa-shopping-cart"></i> Shop Now
                </a>
                <p class="empty-cart-help">Need help? <a href="/contact">Contact us</a></p>
            </div>
        </div>
    `;
    
    // Trigger animation
    setTimeout(() => {
        const emptyCart = cartItems.querySelector('.empty-cart');
        if (emptyCart) {
            emptyCart.style.opacity = '1';
            emptyCart.style.transform = 'translateY(0)';
        }
    }, 10);
    
    // Update header cart count
    updateCartCount(0);
}

// Function to proceed to checkout
function proceedToCheckout() {
    window.location.href = '/checkout/';
}

// Utility function to get CSRF token
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

// Function to update cart count in header
function updateCartCount(count) {
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = count;
        cartCountElement.style.display = count > 0 ? 'block' : 'none';
    }
}