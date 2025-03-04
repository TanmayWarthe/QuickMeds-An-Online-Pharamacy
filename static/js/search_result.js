const searchInput = document.querySelector('.search-input');
const clearSearch = document.querySelector('.clear-search');
const suggestionsContainer = document.querySelector('.search-suggestions');
let searchTimeout;

searchInput.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    const query = this.value.trim();
    
    if (query.length > 0) {
        clearSearch.style.display = 'block';
        searchTimeout = setTimeout(() => fetchSuggestions(query), 300);
    } else {
        clearSearch.style.display = 'none';
        suggestionsContainer.style.display = 'none';
    }
});

clearSearch.addEventListener('click', function() {
    searchInput.value = '';
    this.style.display = 'none';
    suggestionsContainer.style.display = 'none';
});

function fetchSuggestions(query) {
    fetch(`/search/?q=${encodeURIComponent(query)}`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.suggestions.length > 0) {
            displaySuggestions(data.suggestions);
        } else {
            suggestionsContainer.style.display = 'none';
        }
    });
}

function displaySuggestions(suggestions) {
    suggestionsContainer.innerHTML = '';
    
    suggestions.forEach(suggestion => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        
        if (suggestion.type === 'product') {
            item.innerHTML = `
                <img src="${suggestion.image_url}" alt="${suggestion.name}" class="suggestion-image">
                <div class="suggestion-info">
                    <div class="suggestion-name">${suggestion.name}</div>
                    <div class="suggestion-category">${suggestion.category}</div>
                </div>
                <div class="suggestion-price">₹${suggestion.price}</div>
            `;
            item.onclick = () => window.location.href = `/shop/?product_id=${suggestion.id}`;
        } else {
            item.innerHTML = `
                <i class="fas fa-tag suggestion-image" style="font-size: 24px; color: #78ade5;"></i>
                <div class="suggestion-info">
                    <div class="suggestion-name">${suggestion.name}</div>
                    <div class="suggestion-category">${suggestion.count} products</div>
                </div>
            `;
            item.onclick = () => window.location.href = `/product/?category=${suggestion.id}`;
        }
        
        suggestionsContainer.appendChild(item);
    });
    
    suggestionsContainer.style.display = 'block';
}

// Category filtering
const categoryFilters = document.querySelectorAll('.category-filter');
const productCards = document.querySelectorAll('.product-card');

categoryFilters.forEach(filter => {
    filter.addEventListener('click', function() {
        const category = this.textContent;
        
        categoryFilters.forEach(f => f.classList.remove('active'));
        this.classList.add('active');
        
        productCards.forEach(card => {
            if (category === 'All' || card.dataset.category === category) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
});

// Close suggestions when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.search-bar') && !e.target.closest('.search-suggestions')) {
        suggestionsContainer.style.display = 'none';
    }
});

// Submit search on enter
searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        window.location.href = `/search/?q=${encodeURIComponent(this.value)}`;
    }
});

function updateQuantity(productId, action) {
    const input = document.querySelector(`input[data-product-id="${productId}"]`);
    let value = parseInt(input.value);
    
    if (action === 'increase' && value < 10) {
        input.value = value + 1;
    } else if (action === 'decrease' && value > 1) {
        input.value = value - 1;
    }
    
    validateQuantity(input);
}

function validateQuantity(input) {
    let value = parseInt(input.value);
    
    if (isNaN(value) || value < 1) {
        input.value = 1;
    } else if (value > 10) {
        input.value = 10;
    }
    
    // Update minus/plus button states
    const productId = input.dataset.productId;
    const minusBtn = input.previousElementSibling;
    const plusBtn = input.nextElementSibling;
    
    minusBtn.disabled = value <= 1;
    plusBtn.disabled = value >= 10;
}

function addToCart(productId) {
    // Get the button and quantity input
    const addButton = document.querySelector(`[data-product-id="${productId}"]`).closest('.product-card').querySelector('.add-btn');
    const quantityInput = document.querySelector(`input[data-product-id="${productId}"]`);
    const quantity = parseInt(quantityInput.value);

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
            // Update cart count in header and navbar
            const cartCountElements = document.querySelectorAll('.cart-count');
            cartCountElements.forEach(element => {
                element.textContent = data.cart_count;
                // Make counter visible if it was hidden
                element.style.display = data.cart_count > 0 ? 'flex' : 'none';
            });
            
            // Show success message
            showMessage('success', `${quantity} item${quantity > 1 ? 's' : ''} added to cart successfully!`);
            
            // Reset quantity to 1
            quantityInput.value = 1;
            validateQuantity(quantityInput);

            // Trigger a custom event to notify other parts of the application
            document.dispatchEvent(new CustomEvent('cartUpdated', { 
                detail: { 
                    cartCount: data.cart_count 
                } 
            }));
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
            addButton.classList.remove('loading');
        }
    });
}

// Listen for cart updates
document.addEventListener('cartUpdated', function(e) {
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(element => {
        element.textContent = e.detail.cartCount;
        element.style.display = e.detail.cartCount > 0 ? 'flex' : 'none';
    });
});

function showMessage(type, message) {
    const successMsg = document.getElementById('successMessage');
    const errorMsg = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    // Hide both messages first
    successMsg.classList.remove('show');
    errorMsg.classList.remove('show');
    
    if (type === 'success') {
        successMsg.classList.add('show');
        setTimeout(() => {
            successMsg.classList.remove('show');
        }, 3000);
    } else {
        errorText.textContent = message;
        errorMsg.classList.add('show');
        setTimeout(() => {
            errorMsg.classList.remove('show');
        }, 3000);
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

// Initialize quantity controls
document.addEventListener('DOMContentLoaded', function() {
    const quantityInputs = document.querySelectorAll('.quantity-input');
    quantityInputs.forEach(input => validateQuantity(input));
});