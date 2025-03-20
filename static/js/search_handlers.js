// Event handlers for search results page
function handleQuantityClick(event, productId, action) {
    event.stopPropagation();
    updateQuantity(productId, action);
}

function handleQuantityChange(event, input) {
    event.stopPropagation();
    validateQuantity(input);
}

function handleInputClick(event) {
    event.stopPropagation();
}

function handleCartClick(event, productId) {
    event.stopPropagation();
    const button = event.currentTarget;
    button.classList.add('added-to-cart');
    addToCart(productId);
}

// Message display functions
function showSuccessMessage(message) {
    const successMessage = document.getElementById('successMessage');
    if (successMessage) {
        successMessage.querySelector('span').textContent = message;
        successMessage.style.display = 'flex';
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
    }
}

function showErrorMessage(message) {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.querySelector('span').textContent = message;
        errorMessage.style.display = 'flex';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 3000);
    }
}

// Original functions
function updateQuantity(productId, action) {
    const input = document.querySelector(`input[data-product-id="${productId}"]`);
    if (!input) return;

    const currentValue = parseInt(input.value) || 1;
    const maxStock = parseInt(input.getAttribute('max')) || 1;
    
    if (action === 'increase' && currentValue < maxStock) {
        input.value = currentValue + 1;
    } else if (action === 'decrease' && currentValue > 1) {
        input.value = currentValue - 1;
    }
}

function validateQuantity(input) {
    if (!input) return;

    const value = parseInt(input.value) || 0;
    const max = parseInt(input.getAttribute('max')) || 1;
    const min = parseInt(input.getAttribute('min')) || 1;
    
    if (value > max) {
        input.value = max;
        showErrorMessage(`Maximum quantity available is ${max}`);
    } else if (value < min) {
        input.value = min;
        showErrorMessage(`Minimum quantity required is ${min}`);
    }
}

function addToCart(productId) {
    if (!productId) {
        showErrorMessage('Invalid product');
        return;
    }

    const quantityInput = document.querySelector(`input[data-product-id="${productId}"]`);
    if (!quantityInput) {
        showErrorMessage('Could not find quantity input');
        return;
    }

    const quantity = parseInt(quantityInput.value) || 1;
    const button = document.querySelector(`button[onclick*="${productId}"].cart-button`);
    
    if (button) {
        button.disabled = true;
        button.classList.add('adding-to-cart');
    }
    
    // Make API call to add to cart
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
            if (response.status === 401) {
                window.location.href = '/login/';
                throw new Error('Please log in to add items to cart');
            }
            return response.json().then(data => {
                throw new Error(data.message || 'Failed to add to cart');
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showSuccessMessage(data.message || 'Added to cart successfully!');
            // Update cart count in UI if needed
            const cartCount = document.querySelector('.cart-count');
            if (cartCount && data.cart_count !== undefined) {
                cartCount.textContent = data.cart_count;
            }
        } else {
            throw new Error(data.message || 'Failed to add to cart');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showErrorMessage(error.message || 'Failed to add to cart. Please try again.');
    })
    .finally(() => {
        if (button) {
            button.disabled = false;
            button.classList.remove('adding-to-cart');
            // Remove animation class after delay
            setTimeout(() => {
                button.classList.remove('added-to-cart');
            }, 2000);
        }
    });
}

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
