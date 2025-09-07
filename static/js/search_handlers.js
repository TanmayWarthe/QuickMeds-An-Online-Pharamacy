// Import shared cart functionality
import { addToCart, updateCartCount, showNotification, getCookie } from './cart_utils.js';

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

function handleCartClick(event) {
    const button = event.currentTarget;
    const productId = button.dataset.productId;
    const quantityInput = document.querySelector(`input[data-product-id="${productId}"]`);
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
    
    addToCart(productId, quantity);
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

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    const container = document.getElementById('notification-container');
    if (container) {
        container.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}
