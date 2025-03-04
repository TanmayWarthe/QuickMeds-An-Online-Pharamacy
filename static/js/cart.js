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
    
    // Add event listeners to quantity buttons
    quantityBtns.forEach(btn => {
        btn.addEventListener('click', updateQuantity);
    });
    
    // Add event listeners to remove buttons
    removeBtns.forEach(btn => {
        btn.addEventListener('click', removeItem);
    });
    
    // Function to update quantity
    function updateQuantity(e) {
        const btn = e.currentTarget;
        btn.disabled = true;
        
        const itemId = btn.dataset.itemId;
        const change = parseInt(btn.dataset.change);
        const inputEl = document.querySelector(`.quantity-input[data-item-id="${itemId}"]`);
        let currentQty = parseInt(inputEl.value);
        
        // Don't allow quantity less than 1
        if (currentQty + change < 1) {
            btn.disabled = false;
            return;
        }
        
        // Update UI immediately for better UX
        inputEl.value = currentQty + change;
        updateItemTotal(itemId);
        
        // Send request to server
        fetch('/update-cart/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                item_id: itemId,
                quantity: currentQty + change
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update cart total and item count
                document.getElementById('cart-total').textContent = data.cart_total;
                document.getElementById('items-count').textContent = data.items_count;
                
                // Update cart count in header if it exists
                const cartCount = document.getElementById('cart-count');
                if (cartCount) {
                    cartCount.textContent = data.items_count;
                }
            } else {
                // Revert the UI change if there was an error
                inputEl.value = currentQty;
                updateItemTotal(itemId);
                alert(data.error || 'Failed to update cart');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            // Revert the UI change
            inputEl.value = currentQty;
            updateItemTotal(itemId);
            alert('An error occurred. Please try again.');
        })
        .finally(() => {
            btn.disabled = false;
        });
    }
    
    // Function to remove item
    function removeItem(e) {
        const btn = e.currentTarget;
        const itemId = btn.dataset.itemId;
        const itemEl = document.querySelector(`.cart-item[data-item-id="${itemId}"]`);
        
        if (confirm('Are you sure you want to remove this item from your cart?')) {
            btn.disabled = true;
            
            // Add loading effect
            itemEl.style.opacity = '0.5';
            
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
                    // Remove item from DOM with animation
                    itemEl.style.height = itemEl.offsetHeight + 'px';
                    itemEl.style.overflow = 'hidden';
                    
                    setTimeout(() => {
                        itemEl.style.height = '0';
                        itemEl.style.padding = '0';
                        itemEl.style.margin = '0';
                        
                        setTimeout(() => {
                            itemEl.remove();
                            
                            // Update cart total and item count
                            document.getElementById('cart-total').textContent = data.cart_total;
                            document.getElementById('items-count').textContent = data.items_count;
                            
                            // Update cart count in header if it exists
                            const cartCount = document.getElementById('cart-count');
                            if (cartCount) {
                                cartCount.textContent = data.items_count;
                            }
                            
                            // Show empty cart message if no items left
                            if (data.items_count === 0) {
                                const cartItemsEl = document.querySelector('.cart-items');
                                const productUrl = document.getElementById('urls').dataset.productUrl;
                                cartItemsEl.innerHTML = `
                                    <div class="empty-cart">
                                        <p>Your cart is empty</p>
                                        <a href="${productUrl}" class="shop-now-btn">Shop Now</a>
                                    </div>
                                `;
                            }
                        }, 300);
                    }, 10);
                } else {
                    itemEl.style.opacity = '1';
                    alert(data.error || 'Failed to remove item');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                itemEl.style.opacity = '1';
                alert('An error occurred. Please try again.');
                btn.disabled = false;
            });
        }
    }
    
    // Function to update item total
    function updateItemTotal(itemId) {
        const inputEl = document.querySelector(`.quantity-input[data-item-id="${itemId}"]`);
        const totalEl = document.querySelector(`.item-total[data-item-id="${itemId}"]`);
        const price = parseFloat(inputEl.dataset.price);
        const quantity = parseInt(inputEl.value);
        
        const total = price * quantity;
        totalEl.textContent = formatPrice(total);
    }
    
    // Function to format price with commas
    function formatPrice(price) {
        return price.toLocaleString('en-IN');
    }
    
    // Function to get CSRF token
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
    
    // Function to proceed to checkout
    function proceedToCheckout() {
        // Check if cart is empty
        const itemsCount = parseInt(document.getElementById('items-count').textContent);
        if (itemsCount === 0) {
            alert('Your cart is empty. Please add items to your cart before proceeding to checkout.');
            return;
        }
        
        // Redirect to checkout page
        const checkoutUrl = document.getElementById('urls').dataset.checkoutUrl;
        window.location.href = checkoutUrl;
    }
});

// Make the proceedToCheckout function global
function proceedToCheckout() {
    // Check if cart is empty
    const itemsCount = parseInt(document.getElementById('items-count').textContent);
    if (itemsCount === 0) {
        alert('Your cart is empty. Please add items to your cart before proceeding to checkout.');
        return;
    }
    
    // Redirect to checkout page
    const checkoutUrl = document.getElementById('urls').dataset.checkoutUrl;
    window.location.href = checkoutUrl;
}