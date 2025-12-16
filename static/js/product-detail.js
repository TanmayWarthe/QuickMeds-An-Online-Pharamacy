// =================================================================
// PRODUCT DETAIL PAGE - COMPLETE JAVASCRIPT
// Modern, responsive, and fully functional
// =================================================================

// =================================================================
// 1. GLOBAL STATE
// =================================================================

let currentQuantity = 1;
let isWishlisted = false;

// =================================================================
// 2. INITIALIZATION
// =================================================================

document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    loadRelatedProducts();
    updateCartCount();
});

function initializePage() {
    // Set initial quantity
    const quantityInput = document.getElementById('quantity');
    if (quantityInput) {
        currentQuantity = parseInt(quantityInput.value) || 1;
    }
    
    // Check if product is in wishlist
    checkWishlistStatus();
    
    // Add event listeners
    addEventListeners();
    
    // Initialize image gallery if needed
    initializeImageGallery();
}

function addEventListeners() {
    // Prevent form submission on Enter key in quantity input
    const quantityInput = document.getElementById('quantity');
    if (quantityInput) {
        quantityInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });
    }
    
    // Close zoom modal on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeImageZoom();
        }
    });
}

// =================================================================
// 3. QUANTITY CONTROLS
// =================================================================

function incrementQuantity() {
    const quantityInput = document.getElementById('quantity');
    const maxQuantity = parseInt(quantityInput.max);
    
    if (currentQuantity < maxQuantity) {
        currentQuantity++;
        quantityInput.value = currentQuantity;
    } else {
        showNotification(`Maximum ${maxQuantity} items available`, 'warning');
    }
}

function decrementQuantity() {
    const quantityInput = document.getElementById('quantity');
    
    if (currentQuantity > 1) {
        currentQuantity--;
        quantityInput.value = currentQuantity;
    }
}

// =================================================================
// 4. ADD TO CART
// =================================================================

function addToCartFromDetail() {
    const button = event.currentTarget;
    
    if (button.disabled) {
        return;
    }
    
    // Disable button temporarily
    button.disabled = true;
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Adding...</span>';
    
    fetch(`/add-to-cart/${PRODUCT_ID}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            'product_id': PRODUCT_ID,
            'quantity': currentQuantity
        }),
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 403) {
                showNotification('Please login to add items to cart', 'error');
                setTimeout(() => {
                    window.location.href = '/login/';
                }, 2000);
                throw new Error('Not authenticated');
            }
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            updateCartCount();
            showNotification(`${currentQuantity} item(s) added to cart!`, 'success');
            
            // Animate the button
            button.innerHTML = '<i class="fas fa-check"></i> <span>Added!</span>';
            button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            
            // Animate cart icon
            const cartIcon = document.querySelector('.cart-icon');
            if (cartIcon) {
                cartIcon.classList.add('bounce');
                setTimeout(() => {
                    cartIcon.classList.remove('bounce');
                }, 1000);
            }
            
            // Reset button after delay
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.style.background = '';
                button.disabled = false;
            }, 2000);
        } else {
            throw new Error(data.message || 'Failed to add item to cart');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification(error.message || 'Failed to add to cart', 'error');
        button.innerHTML = originalHTML;
        button.disabled = false;
    });
}

// =================================================================
// 5. BUY NOW
// =================================================================

function buyNow() {
    const button = event.currentTarget;
    
    if (button.disabled) {
        return;
    }
    
    button.disabled = true;
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Processing...</span>';
    
    fetch(`/add-to-cart/${PRODUCT_ID}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            'product_id': PRODUCT_ID,
            'quantity': currentQuantity,
            'buy_now': true
        }),
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 403) {
                showNotification('Please login to continue', 'error');
                setTimeout(() => {
                    window.location.href = '/login/';
                }, 2000);
                throw new Error('Not authenticated');
            }
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Redirect to checkout
            window.location.href = '/checkout/';
        } else {
            throw new Error(data.message || 'Failed to process order');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification(error.message || 'Failed to process order', 'error');
        button.innerHTML = originalHTML;
        button.disabled = false;
    });
}

// =================================================================
// 6. WISHLIST
// =================================================================

function toggleWishlist() {
    const button = event.currentTarget;
    const icon = button.querySelector('i');
    
    if (isWishlisted) {
        // Remove from wishlist
        icon.classList.remove('fas');
        icon.classList.add('far');
        button.classList.remove('active');
        isWishlisted = false;
        removeFromWishlist(PRODUCT_ID);
        const button = event.currentTarget;
        if (button.disabled) return;
        button.disabled = true;
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        fetch(`/add-to-cart/${PRODUCT_ID}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                'product_id': PRODUCT_ID,
                'quantity': currentQuantity
            }),
            credentials: 'same-origin'
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 403) {
                    showNotification('Please login to add items to cart', 'error');
                    setTimeout(() => {
                        window.location.href = '/login/';
                    }, 2000);
                    throw new Error('Not authenticated');
                }
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                updateCartCount();
                showNotification(`${currentQuantity} item(s) added to cart!`, 'success');
                button.innerHTML = '<i class="fas fa-check"></i> Added';
                setTimeout(() => {
                    button.innerHTML = originalHTML;
                    button.disabled = false;
                }, 1500);
            } else {
                throw new Error(data.message || 'Failed to add item to cart');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification(error.message || 'Failed to add to cart', 'error');
            button.innerHTML = originalHTML;
            button.disabled = false;
        });
        icon.classList.add('fas');
        button.classList.add('active');
        isWishlisted = true;
        addToWishlist(PRODUCT_ID);
        showNotification('Added to wishlist', 'success');
    }
}

function checkWishlistStatus() {
    // Check localStorage for wishlist
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    isWishlisted = wishlist.includes(PRODUCT_ID);
    
    if (isWishlisted) {
        const button = document.querySelector('.btn-wishlist');
        const icon = button?.querySelector('i');
        if (icon) {
            icon.classList.remove('far');
            icon.classList.add('fas');
            button.classList.add('active');
        }
    }
}

function addToWishlist(productId) {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    if (!wishlist.includes(productId)) {
        wishlist.push(productId);
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
}

function removeFromWishlist(productId) {
    let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    wishlist = wishlist.filter(id => id !== productId);
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

// =================================================================
// 7. NOTIFY WHEN AVAILABLE
// =================================================================

function notifyWhenAvailable() {
    showNotification('You will be notified when this product is back in stock', 'success');
    // TODO: Implement actual notification system
}

// =================================================================
// 8. TAB SWITCHING
// =================================================================

function switchTab(tabName) {
    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Add active class to selected tab
    const selectedBtn = event.currentTarget;
    selectedBtn.classList.add('active');
    
    const selectedContent = document.getElementById(tabName);
    if (selectedContent) {
        selectedContent.classList.add('active');
    }
}

// =================================================================
// 9. IMAGE ZOOM
// =================================================================

function toggleImageZoom() {
    const modal = document.getElementById('imageZoomModal');
    const mainImage = document.getElementById('mainImage');
    const zoomedImage = document.getElementById('zoomedImage');
    
    if (modal && mainImage && zoomedImage) {
        zoomedImage.src = mainImage.src;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeImageZoom() {
    const modal = document.getElementById('imageZoomModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// =================================================================
// 10. IMAGE GALLERY
// =================================================================

function initializeImageGallery() {
    // Initialize thumbnail gallery
    const thumbnails = document.querySelectorAll('.thumbnail-item');
    if (thumbnails.length > 0) {
        thumbnails.forEach(thumbnail => {
            thumbnail.addEventListener('click', function() {
                changeMainImage(this);
            });
        });
    }
}

function changeMainImage(thumbnail) {
    // Remove active class from all thumbnails
    document.querySelectorAll('.thumbnail-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to clicked thumbnail
    thumbnail.classList.add('active');
    
    // Get the image URL from data attribute
    const imageUrl = thumbnail.getAttribute('data-image');
    
    // Update main image
    const mainImage = document.getElementById('mainImage');
    if (mainImage && imageUrl) {
        mainImage.src = imageUrl;
    }
}

// =================================================================
// 11. RELATED PRODUCTS
// =================================================================

function loadRelatedProducts() {
    const container = document.getElementById('relatedProducts');
    
    if (!container) {
        return;
    }
    
    // Show loading state
    container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Loading related products...</p></div>';
    
    // Fetch related products from the same category
    fetch(`/api/related-products/${PRODUCT_ID}/?category_id=${PRODUCT_CATEGORY_ID}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load related products');
        }
        return response.json();
    })
    .then(data => {
        if (data.success && data.products && data.products.length > 0) {
            displayRelatedProducts(data.products);
        } else {
            // If no related products, hide the section
            container.innerHTML = '<p class="text-center" style="color: #94a3b8; padding: 2rem;">No related products found</p>';
        }
    })
    .catch(error => {
        console.error('Error loading related products:', error);
        container.innerHTML = '<p class="text-center" style="color: #94a3b8; padding: 2rem;">Unable to load related products</p>';
    });
}

function displayRelatedProducts(products) {
    const container = document.getElementById('relatedProducts');
    
    if (!container) {
        return;
    }
    
    container.innerHTML = products.slice(0, 4).map(product => {
        const discountBadge = product.discount_percentage > 0 ? 
            `<span class="discount-badge">-${Math.round(product.discount_percentage)}%</span>` : '';
        
        const originalPrice = product.original_price && product.original_price > product.price ? 
            `<span class="original-price">₹${product.original_price}</span>` : '';
        
        const addToCartButton = product.stock > 0 ? 
            `<button class="btn-add-cart" onclick="addToCartQuick(event, ${product.id})">
                <i class="fas fa-shopping-cart"></i> Add to Cart
            </button>` :
            `<button class="btn-out-of-stock" disabled>Out of Stock</button>`;
        
        return `
            <div class="product-card" onclick="navigateToProduct(${product.id}, event)" data-product-id="${product.id}">
                <div class="product-image-wrapper">
                    <img src="${product.image_url || '/static/img/medicines-icon.png'}" alt="${product.name}" class="product-image">
                    ${discountBadge}
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">
                        <span class="current-price">₹${product.price}</span>
                        ${originalPrice}
                    </div>
                    ${addToCartButton}
                </div>
            </div>
        `;
    }).join('');
}

// =================================================================
// 12. QUICK ADD TO CART (for related products)
// =================================================================

function addToCartQuick(event, productId) {
    event.stopPropagation();
    event.preventDefault();
    
    const button = event.currentTarget;
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    button.disabled = true;
    
    fetch(`/add-to-cart/${productId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            'product_id': productId,
            'quantity': 1
        }),
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 403) {
                showNotification('Please login to add items to cart', 'error');
                setTimeout(() => {
                    window.location.href = '/login/';
                }, 2000);
                throw new Error('Not authenticated');
            }
            throw new Error('Failed to add to cart');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            updateCartCount();
            showNotification('Added to cart successfully!', 'success');
            button.innerHTML = '<i class="fas fa-check"></i> Added';
            
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.disabled = false;
            }, 2000);
        } else {
            throw new Error(data.message || 'Failed to add to cart');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification(error.message || 'Failed to add to cart', 'error');
        button.innerHTML = originalHTML;
        button.disabled = false;
    });
}

// =================================================================
// 13. NAVIGATE TO PRODUCT
// =================================================================

function navigateToProduct(productId, event) {
    if (event) {
        // Don't navigate if clicking on the add to cart button
        if (event.target.closest('.btn-add-cart')) {
            return;
        }
    }
    // Open in same page
    window.location.href = `/product/${productId}/`;
}

// =================================================================
// 14. CART MANAGEMENT
// =================================================================

function updateCartCount() {
    fetch('/get-cart-count/', {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to get cart count');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            updateCartBadge(data.cart_count);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function updateCartBadge(count) {
    const cartBadge = document.querySelector('.cart-badge');
    if (cartBadge) {
        if (count > 0) {
            cartBadge.textContent = count;
            cartBadge.style.display = 'flex';
            // Add bounce animation
            cartBadge.classList.add('bounce');
            setTimeout(() => {
                cartBadge.classList.remove('bounce');
            }, 500);
        } else {
            cartBadge.style.display = 'none';
        }
    }
}

// =================================================================
// 15. NOTIFICATION SYSTEM
// =================================================================

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-weight: 600;
        animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s;
        max-width: 400px;
    `;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// =================================================================
// 16. UTILITY FUNCTIONS
// =================================================================

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

// =================================================================
// 17. SCROLL TO TOP
// =================================================================

window.addEventListener('scroll', function() {
    const scrollBtn = document.getElementById('scrollTopBtn');
    if (scrollBtn) {
        if (window.pageYOffset > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    }
});

// =================================================================
// 18. ANIMATIONS
// =================================================================

// Add animation styles if needed
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// =================================================================
// END OF PRODUCT DETAIL JAVASCRIPT
// =================================================================
