function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

document.addEventListener('DOMContentLoaded', function() {
    // Update quantity
    function updateQuantity(productId, newQuantity) {
        if (!productId) {
            console.error('Product ID is missing');
            return;
        }

        const cartItem = document.querySelector(`[data-item-id="${productId}"]`);
        if (!cartItem) {
            console.error('Cart item not found');
            return;
        }

        // Show loading state
        cartItem.classList.add('updating');

    fetch('/update-cart-item/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
                'Accept': 'application/json'
        },
        body: JSON.stringify({
                item_id: productId,
                quantity: newQuantity
            })
    })
    .then(response => {
        if (!response.ok) {
                throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
                // Update cart total with animation
                const cartTotalElements = document.querySelectorAll('.cart-total');
                cartTotalElements.forEach(el => {
                    el.classList.add('price-update');
                    el.textContent = `₹${data.cart_total}`;
                    setTimeout(() => el.classList.remove('price-update'), 300);
                });

                // Update cart subtotal with animation
                const cartSubtotalElements = document.querySelectorAll('.cart-subtotal');
                cartSubtotalElements.forEach(el => {
                    el.classList.add('price-update');
                    el.textContent = `₹${data.cart_total}`;
                    setTimeout(() => el.classList.remove('price-update'), 300);
                });
            
            // Update item total with animation
                const itemTotalElement = cartItem.querySelector('.item-total');
                if (itemTotalElement) {
                    itemTotalElement.classList.add('price-update');
                    itemTotalElement.textContent = `₹${data.item_total}`;
                    setTimeout(() => itemTotalElement.classList.remove('price-update'), 300);
                }

                // Update cart count in header
                const cartBadge = document.querySelector('.cart-icon .badge');
                if (cartBadge) {
                    cartBadge.textContent = data.items_count;
                }

                // Update items count
                const itemsCountElement = document.querySelector('.items-count');
                if (itemsCountElement) {
                    itemsCountElement.textContent = `${data.items_count} item${data.items_count !== 1 ? 's' : ''}`;
                }

                showNotification('Cart updated successfully', 'success');
            } else {
                // Revert quantity input to previous value if update failed
                const input = cartItem.querySelector('.quantity-input');
                if (input) {
                    input.value = input.getAttribute('data-previous-value') || 1;
                }
                showNotification(data.message || 'Failed to update cart', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Failed to update cart', 'error');
            
            // Revert quantity input to previous value on error
            const input = cartItem.querySelector('.quantity-input');
            if (input) {
                input.value = input.getAttribute('data-previous-value') || 1;
            }
    })
    .finally(() => {
            // Remove loading state
            cartItem.classList.remove('updating');
        });
    }

    // Remove item from cart
    function removeFromCart(productId) {
        if (!productId) {
            console.error('Product ID is missing');
            return;
        }

        const cartItem = document.querySelector(`[data-item-id="${productId}"]`);
        if (!cartItem) {
            console.error('Cart item not found');
            return;
        }

        // Show loading state
        cartItem.classList.add('removing');
    
    fetch('/remove-cart-item/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
                'Accept': 'application/json'
        },
        body: JSON.stringify({
                item_id: productId
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
    })
    .then(data => {
        if (data.success) {
                // Animate item removal
                cartItem.style.height = cartItem.offsetHeight + 'px';
                cartItem.classList.add('removing');
                
                setTimeout(() => {
                    cartItem.remove();
                    
                    // Update cart total with animation
                    const cartTotalElements = document.querySelectorAll('.cart-total');
                    cartTotalElements.forEach(el => {
                        el.classList.add('price-update');
                        el.textContent = `₹${data.cart_total}`;
                        setTimeout(() => el.classList.remove('price-update'), 300);
                    });

                    // Update cart subtotal with animation
                    const cartSubtotalElements = document.querySelectorAll('.cart-subtotal');
                    cartSubtotalElements.forEach(el => {
                        el.classList.add('price-update');
                        el.textContent = `₹${data.cart_total}`;
                        setTimeout(() => el.classList.remove('price-update'), 300);
                    });
            
            // Update cart count in header
                    const cartBadge = document.querySelector('.cart-icon .badge');
                    if (cartBadge) {
                        cartBadge.textContent = data.items_count;
                    }

                    // Update items count
                    const itemsCountElement = document.querySelector('.items-count');
                    if (itemsCountElement) {
                        itemsCountElement.textContent = `${data.items_count} item${data.items_count !== 1 ? 's' : ''}`;
                    }
            
            // Show empty cart message if no items left
            if (data.items_count === 0) {
                        location.reload();
                    }

                    showNotification('Item removed from cart', 'success');
                }, 300);
            } else {
                showNotification(data.message || 'Failed to remove item', 'error');
                cartItem.classList.remove('removing');
        }
    })
    .catch(error => {
        console.error('Error:', error);
            showNotification('Failed to remove item', 'error');
            cartItem.classList.remove('removing');
        });
    }

    // Event listeners for quantity buttons
    document.querySelectorAll('.quantity-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const cartItem = this.closest('.cart-item');
            const productId = cartItem.getAttribute('data-item-id');
            const input = cartItem.querySelector('.quantity-input');
            const currentValue = parseInt(input.value);
            
            // Store previous value
            input.setAttribute('data-previous-value', currentValue);
            
            let newQuantity = currentValue;
            if (this.classList.contains('minus')) {
                newQuantity = Math.max(1, currentValue - 1);
            } else {
                const maxStock = parseInt(input.getAttribute('max')) || 10;
                newQuantity = Math.min(maxStock, currentValue + 1);
            }

            if (newQuantity !== currentValue) {
                input.value = newQuantity;
                updateQuantity(productId, newQuantity);
            }
        });
    });

    // Event listeners for quantity input
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('focus', function() {
            // Store the current value before change
            this.setAttribute('data-previous-value', this.value);
        });

        input.addEventListener('change', function() {
            const cartItem = this.closest('.cart-item');
            const productId = cartItem.getAttribute('data-item-id');
            const maxStock = parseInt(this.getAttribute('max')) || 10;
            const previousValue = parseInt(this.getAttribute('data-previous-value')) || 1;
            let newQuantity = parseInt(this.value);
            
            // Validate input
            if (isNaN(newQuantity) || newQuantity < 1) {
                newQuantity = 1;
            } else if (newQuantity > maxStock) {
                newQuantity = maxStock;
            }

            this.value = newQuantity;
            
            if (newQuantity !== previousValue) {
                updateQuantity(productId, newQuantity);
            }
        });
    });

    // Event listeners for remove buttons
    document.querySelectorAll('.remove-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const cartItem = this.closest('.cart-item');
            const productId = cartItem.getAttribute('data-item-id');
            
            if (confirm('Are you sure you want to remove this item?')) {
                removeFromCart(productId);
            }
        });
    });
});

// Helper function to get CSRF token
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

// Function to show notifications
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const messageSpan = document.getElementById('notification-message');
    
    if (notification && messageSpan) {
        notification.style.display = 'flex';
        notification.className = `notification ${type}`;
        messageSpan.textContent = message;
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.style.display = 'none';
            }, 300);
        }, 3000);
    }
}

// Function to proceed to checkout
function proceedToCheckout() {
    window.location.href = document.getElementById('urls').getAttribute('data-checkout-url');
}