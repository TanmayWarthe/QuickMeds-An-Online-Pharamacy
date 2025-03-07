function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

document.addEventListener('DOMContentLoaded', function () {
    const quantityButtons = document.querySelectorAll('.quantity-btn');
    quantityButtons.forEach(button => {
        button.addEventListener('click', function () {
            const itemId = this.dataset.itemId;
            const change = parseInt(this.dataset.change);
            updateQuantity(itemId, change);
        });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // Get all quantity buttons
    const quantityBtns = document.querySelectorAll('.quantity-btn');
    const removeBtns = document.querySelectorAll('.remove-btn');
    
    // Add click event listeners to quantity buttons
    quantityBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = this.dataset.itemId;
            const change = parseInt(this.dataset.change);
            updateQuantity(itemId, change);
        });
    });
    
    // Add click event listeners to remove buttons
    removeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = this.dataset.itemId;
            removeItem(itemId);
        });
    });
});

// Function to update quantity
function updateQuantity(itemId, change) {
    const quantityInput = document.querySelector(`.quantity-input[data-item-id="${itemId}"]`);
    const currentQuantity = parseInt(quantityInput.value);
    const newQuantity = currentQuantity + change;
    
    if (newQuantity < 1) return;
    
    // Update the input value
    quantityInput.value = newQuantity;
    
    // Calculate new total
    const price = parseFloat(quantityInput.dataset.price);
    const newTotal = price * newQuantity;
    
    // Update the item total display
    const itemTotal = document.querySelector(`.item-total[data-item-id="${itemId}"]`);
    itemTotal.textContent = newTotal.toLocaleString();
    
    // Update cart total
    updateCartTotal();
    
    // Send update to server
    fetch('/update-cart-item/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            item_id: itemId,
            quantity: newQuantity
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateCartCount(data.items_count);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
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

// Function to update cart total
function updateCartTotal() {
    const itemTotals = document.querySelectorAll('.item-total');
    let total = 0;
    
    itemTotals.forEach(item => {
        total += parseFloat(item.textContent.replace(/,/g, ''));
    });
    
    document.getElementById('cart-total').textContent = total.toLocaleString();
}

// Function to show empty cart message
function showEmptyCart() {
    const cartItems = document.querySelector('.cart-items');
    const cartSummary = document.querySelector('.cart-summary');
    
    cartItems.innerHTML = `
        <div class="empty-cart">
            <i class="fas fa-shopping-basket"></i>
            <p>Your cart is empty</p>
            <a href="/product/" class="shop-now-btn">
                <i class="fas fa-shopping-cart"></i> Shop Now
            </a>
        </div>
    `;
    
    if (cartSummary) {
        cartSummary.remove();
    }
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

// Function to show notification
function showNotification(message, type = 'success') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Set icon based on type
    const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s forwards';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Function to update cart count in header
function updateCartCount(count) {
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = count;
        cartCountElement.style.display = count > 0 ? 'block' : 'none';
    }
}