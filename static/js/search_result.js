document.addEventListener('DOMContentLoaded', function() {
    // Category filtering
    const categoryFilters = document.querySelectorAll('.category-filter');
    const productCards = document.querySelectorAll('.product-card');

    categoryFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            const category = this.textContent;
            
            // Update active state
            categoryFilters.forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            
            // Filter products
            productCards.forEach(card => {
                if (category === 'All' || card.dataset.category === category) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // Quantity controls
    function updateQuantity(productId, action) {
        const input = document.querySelector(`input[data-product-id="${productId}"]`);
        let value = parseInt(input.value);
        
        if (action === 'increase') {
            value++;
        } else if (action === 'decrease' && value > 1) {
            value--;
        }
        
        input.value = value;
    }

    // Add to cart functionality
    function addToCart(productId) {
        const quantityInput = document.querySelector(`input[data-product-id="${productId}"]`);
        const quantity = parseInt(quantityInput.value);
        const button = document.querySelector(`button[data-product-id="${productId}"]`);
        
        button.disabled = true;
        
        fetch('/add-to-cart/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                product_id: productId,
                quantity: quantity
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMessage('success', 'Item added to cart successfully!');
                updateCartCount(data.items_count);
            } else {
                showMessage('error', data.error || 'Failed to add item to cart');
            }
        })
        .catch(error => {
            showMessage('error', 'An error occurred. Please try again.');
        })
        .finally(() => {
            button.disabled = false;
        });
    }

    // Helper functions
    function showMessage(type, message) {
        const messageElement = document.getElementById(`${type}Message`);
        const textElement = type === 'error' ? document.getElementById('errorText') : messageElement.querySelector('span');
        textElement.textContent = message;
        
        messageElement.style.display = 'flex';
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 3000);
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

    function updateCartCount(count) {
        const cartCountElement = document.getElementById('cartCount');
        if (cartCountElement) {
            cartCountElement.textContent = count;
        }
    }

    // Make functions globally available
    window.updateQuantity = updateQuantity;
    window.addToCart = addToCart;
});