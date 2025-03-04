// Quantity buttons
document.querySelectorAll('.quantity-btn').forEach(button => {
    button.addEventListener('click', () => {
        const input = button.parentElement.querySelector('.quantity-input');
        let value = parseInt(input.value);
        if (button.textContent === '-') {
            if (value > 1) input.value = value - 1;
        } else {
            input.value = value + 1;
        }
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
    // Get the quantity
    const quantityInput = document.getElementById('quantity');
    const quantity = parseInt(quantityInput.value);
    
    // Disable the button to prevent multiple clicks
    const addButton = document.querySelector('.add-to-cart-btn');
    if (addButton) {
        addButton.disabled = true;
        addButton.style.opacity = '0.7';
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
            const cartCount = document.getElementById('cart-count');
            if (cartCount) {
                cartCount.textContent = data.cart_count;
            }
            
            // Show success message
            showMessage('success', 'Added to cart successfully!');
        } else {
            throw new Error(data.error || 'Failed to add to cart');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('error', error.message || 'An error occurred. Please try again.');
    })
    .finally(() => {
        // Re-enable the button
        if (addButton) {
            addButton.disabled = false;
            addButton.style.opacity = '1';
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

function showMessage(type, message) {
    const successMsg = document.getElementById('successMessage');
    const errorMsg = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';
    
    if (type === 'success') {
        successMsg.style.display = 'block';
        setTimeout(() => {
            successMsg.style.display = 'none';
        }, 3000);
    } else {
        errorText.textContent = message;
        errorMsg.style.display = 'block';
        setTimeout(() => {
            errorMsg.style.display = 'none';
        }, 3000);
    }
}

function updateQuantity(change) {
    const input = document.getElementById('quantity');
    const newValue = parseInt(input.value) + change;
    const maxStock = parseInt(input.getAttribute('max'));
    const errorDiv = document.getElementById('quantityError');
    
    if (newValue >= 1 && newValue <= maxStock) {
        input.value = newValue;
        errorDiv.style.display = 'none';
    } else if (newValue > maxStock) {
        errorDiv.textContent = 'Quantity exceeds available stock';
        errorDiv.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const addToCartForm = document.querySelector('.add-to-cart-form');
    const quantityInput = document.getElementById('quantity');

    quantityInput.addEventListener('change', function() {
        const value = parseInt(this.value);
        const max = parseInt(this.getAttribute('max'));
        const errorDiv = document.getElementById('quantityError');
        
        if (value < 1 || isNaN(value)) {
            this.value = 1;
            errorDiv.style.display = 'none';
        } else if (value > max) {
            this.value = max;
            errorDiv.textContent = 'Quantity exceeds available stock';
            errorDiv.style.display = 'block';
        } else {
            errorDiv.style.display = 'none';
        }
    });

    addToCartForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.classList.add('loading');
        
        const formData = new FormData(this);

        fetch(this.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            submitBtn.classList.remove('loading');
            if (data.success) {
                showMessage('success', 'Added to cart successfully!');
                if (data.cart_count !== undefined) {
                    const cartCount = document.getElementById('cart-count');
                    if (cartCount) {
                        cartCount.textContent = data.cart_count;
                    }
                }
            } else {
                showMessage('error', data.message || 'Failed to add to cart');
            }
        })
        .catch(error => {
            submitBtn.classList.remove('loading');
            showMessage('error', 'An error occurred. Please try again.');
            console.error('Error:', error);
        });
    });
});