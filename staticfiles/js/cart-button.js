// Cart button click handler for search results and product listings

function handleCartClick(event, productId) {
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.currentTarget;
    
    // Prevent multiple clicks
    if (button.disabled || button.classList.contains('clicked')) {
        return;
    }
    
    // Disable button and add clicked state
    button.disabled = true;
    button.classList.add('clicked');
    
    // Get quantity from nearby quantity display if available
    let quantity = 1;
    const quantityDisplay = button.closest('.product-actions')?.querySelector('.quantity-display');
    if (quantityDisplay) {
        quantity = parseInt(quantityDisplay.textContent) || 1;
    }
    
    // Add to cart using the shared cart utility
    addToCart(productId, quantity)
        .finally(() => {
            // Re-enable button after delay
            setTimeout(() => {
                button.disabled = false;
                button.classList.remove('clicked');
            }, 2000);
        });
}

// Handle quantity changes for products
function handleQuantityClick(event, productId, action) {
    event.preventDefault();
    event.stopPropagation();
    
    const quantityDisplay = event.currentTarget.closest('.quantity-selector')?.querySelector('.quantity-display');
    if (!quantityDisplay) return;
    
    let currentQuantity = parseInt(quantityDisplay.textContent) || 1;
    
    if (action === 'increase') {
        currentQuantity++;
    } else if (action === 'decrease' && currentQuantity > 1) {
        currentQuantity--;
    }
    
    quantityDisplay.textContent = currentQuantity;
}
