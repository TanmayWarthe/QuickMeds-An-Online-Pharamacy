function updateQuantity(itemId, change) {
    const csrftoken = getCookie('csrftoken');

    fetch('/update-cart/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify({
            item_id: itemId,
            action: change > 0 ? 'increase' : 'decrease'
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (data.deleted) {
                    // Remove item if quantity reaches 0
                    const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
                    if (itemElement) itemElement.remove();
                } else {
                    // Update quantity and total
                    updateItemDisplay(itemId, data.quantity, data.item_total);
                }

                // Update cart summary
                updateCartSummary(data.cart_total, data.items_count);

                // Show empty cart message if no items left
                if (data.items_count === 0) {
                    showEmptyCartMessage();
                }
            }
        })
        .catch(error => console.error('Error:', error));
}

function removeItem(itemId) {
    if (confirm('Are you sure you want to remove this item?')) {
        const csrftoken = getCookie('csrftoken');

        fetch('/remove-cart-item/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify({
                item_id: itemId
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
                    if (itemElement) itemElement.remove();

                    // Update cart summary
                    updateCartSummary(data.cart_total, data.items_count);

                    // Show empty cart message if no items left
                    if (data.items_count === 0) {
                        showEmptyCartMessage();
                    }
                }
            })
            .catch(error => console.error('Error:', error));
    }
}

function updateItemDisplay(itemId, quantity, total) {
    const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
    if (itemElement) {
        const quantityInput = itemElement.querySelector('.quantity-input');
        const itemTotal = itemElement.querySelector('.item-total');
        if (quantityInput && itemTotal) {
            quantityInput.value = quantity;
            itemTotal.textContent = `₹${total}`;
        }
    }
}

function updateCartSummary(total, count) {
    const totalElement = document.querySelector('.total-amount');
    const countElement = document.querySelector('.items-count-value');

    if (totalElement && countElement) {
        totalElement.textContent = `₹${total}`;
        countElement.textContent = count;
    }
}

function showEmptyCartMessage() {
    const cartItems = document.querySelector('.cart-items');
    if (cartItems) {
        cartItems.innerHTML = `
        <div class="empty-cart">
            <p>Your cart is empty</p>
            <a href="/product/" class="shop-now-btn">Shop Now</a>
        </div>
    `;
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

function addToCart(productId) {
    const csrftoken = getCookie('csrftoken');

    fetch('/add-to-cart/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify({
            product_id: productId,
            quantity: 1
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update cart count
                const cartCount = document.querySelector('.cart-count');
                if (cartCount) {
                    cartCount.textContent = data.cart_count;
                }

                // Show success message
                showMessage('Added to cart successfully!', 'success');
            } else {
                showMessage(data.error || 'Failed to add to cart', 'error');
            }
        })
        .catch(error => {
            showMessage('An error occurred', 'error');
        });
}

function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;

    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}



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
