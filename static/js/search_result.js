// Import shared cart functionality
import { addToCart, updateCartCount, showNotification, getCookie } from './cart_utils.js';

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
        const button = document.querySelector(`button[data-product-id="${productId}"]`);
        
        if (!button || button.disabled || button.classList.contains('clicked')) {
            return;
        }
    
        button.disabled = true;
        button.classList.add('clicked');
        
        fetch(`/add-to-cart/${productId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                quantity: 1
            })
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 403) {
                    window.location.href = '/login/';
                    return;
                }
                throw new Error('Failed to add item to cart');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Update cart count
                const cartBadge = document.querySelector('.cart-icon .badge');
                if (cartBadge && data.cart_count !== undefined) {
                    cartBadge.textContent = data.cart_count;
                }
                
                // Show success message
                showNotification('Added to cart successfully!', 'success');
                
                // Animate cart icon if it exists
                const cartIcon = document.querySelector('.cart-icon');
                if (cartIcon) {
                    cartIcon.classList.add('cart-animation');
                    setTimeout(() => {
                        cartIcon.classList.remove('cart-animation');
                    }, 1000);
                }
            } else {
                throw new Error(data.message || 'Failed to add item to cart');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification(error.message || 'Failed to add item to cart', 'error');
        })
        .finally(() => {
            setTimeout(() => {
                button.disabled = false;
                button.classList.remove('clicked');
            }, 2000);
        });
    }

    // Handle cart click with proper animations
    function handleCartClick(event) {
        const button = event.currentTarget;
        const productId = button.dataset.productId;
        const quantityInput = document.querySelector(`input[data-product-id="${productId}"]`);
        const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
        
        addToCart(productId, quantity);
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

    // Utility function to show notifications
    function showNotification(message, type = 'success') {
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);

        // Remove notification after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Initialize cart functionality when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        // Add click handlers to all cart buttons
        document.querySelectorAll('.cart-button').forEach(button => {
            const productId = button.getAttribute('data-product-id');
            if (productId) {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    addToCart(productId);
                });
            }
        });
    });

    // Make functions globally available
    window.updateQuantity = updateQuantity;
    window.addToCart = addToCart;
    window.showNotification = showNotification;
    window.handleCartClick = handleCartClick;
});